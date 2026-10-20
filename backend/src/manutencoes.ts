import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import { SELECT_OS, filtroVisibilidadeOS, mapOS, statusDoItem } from "./os_comum.js";
import { buildMaintenanceCreatedNotificationMessage, createNotificationsForTime } from "./notificacoes.js";

// Perfis que enxergam todas as manutenções. Produção, software e implantação
// só enxergam manutenções que tenham ao menos uma O.S. direcionada ao seu time.
// Comercial não acessa manutenções.
const PERFIS_VEEM_TODOS: Role[] = ["gestor", "suporte"];
const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "suporte",
  "producao",
  "software",
  "implantacao",
];

const TIPOS = ["preventiva", "corretiva", "adaptativa", "evolutiva"] as const;
const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
type Tipo = (typeof TIPOS)[number];
type Prioridade = (typeof PRIORIDADES)[number];

type RequireRole = (...roles: Role[]) => RequestHandler;

function veTodos(user: User): boolean {
  return PERFIS_VEEM_TODOS.includes(user.role);
}

// Condição SQL (alias "m" = tabela manutencoes) com as manutenções que o usuário pode ver.
function filtroManutencao(user: User): { sql: string; params: number[] } {
  if (veTodos(user)) return { sql: "1 = 1", params: [] };
  if (user.time_id === null) return { sql: "1 = 0", params: [] };
  return {
    sql: `(m.id_time_responsavel = ? OR EXISTS (SELECT 1 FROM os ox
                   WHERE ox.manutencao_id = m.manutencao_id AND ox.id_time_responsavel = ?))`,
    params: [Number(user.time_id), Number(user.time_id)],
  };
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

const SELECT_MANUTENCAO = `
  SELECT m.manutencao_id,
         m.resumo,
         m.tipo_manutencao,
         m.prioridade,
         m.status AS status_manutencao,
         m.descricao_situacao,
         m.projeto_id,
         pr.nome AS projeto_nome,
         DATE_FORMAT(m.data_limite, '%Y-%m-%d') AS data_limite,
         resp.nome AS responsavel_nome,
         DATE_FORMAT(m.data_inicio_problema, '%Y-%m-%d') AS data_inicio_problema,
         (SELECT COUNT(*) FROM os o WHERE o.manutencao_id = m.manutencao_id) AS total_os,
         (SELECT COUNT(*) FROM os o
           WHERE o.manutencao_id = m.manutencao_id AND o.os_status <> 'concluida') AS os_nao_concluidas
    FROM manutencoes m
    LEFT JOIN usuarios resp ON resp.id_usuario = m.responsavel_id
    LEFT JOIN projetos pr ON pr.projeto_id = m.projeto_id`;

function mapManutencaoResumo(m: RowDataPacket) {
  return {
    id: String(m.manutencao_id),
    resumo: (m.resumo as string | null) ?? "",
    prioridade: m.prioridade as string,
    responsavel: (m.responsavel_nome as string | null) ?? null,
    status:
      m.status_manutencao === "cancelada"
        ? "cancelado"
        : statusDoItem(Number(m.total_os), Number(m.os_nao_concluidas)),
  };
}

export function createManutencoesRouter(requireRole: RequireRole): Router {
  const router = Router();

  // ---------------------------------------------------
  // Projetos disponíveis para vincular a uma nova manutenção
  // ---------------------------------------------------
  router.get("/projetos", requireRole("suporte"), async (_req, res) => {
    try {
      const [projetos] = await pool.execute<RowDataPacket[]>(
        `SELECT projeto_id AS id_projeto, nome, id_time_responsavel
           FROM projetos
          ORDER BY nome`,
      );
      return res.json({ projetos });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Não foi possível carregar os projetos." });
    }
  });

  // ---------------------------------------------------
  // Listagem (aba "Manutenções") - dados resumidos para os tickets
  // gestor e suporte: todas | demais: só manutenções com O.S. do seu time
  // ---------------------------------------------------
  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const filtro = filtroManutencao(user);

      const [manutencoes] = await pool.execute<RowDataPacket[]>(
        `${SELECT_MANUTENCAO}
          WHERE ${filtro.sql}
          ORDER BY m.data_criacao DESC, m.manutencao_id DESC`,
        filtro.params,
      );

      return res.json({ manutencoes: manutencoes.map(mapManutencaoResumo) });
    } catch (error) {
      console.error("Erro ao listar manutenções:", error);
      return res.status(500).json({ message: "Não foi possível carregar as manutenções." });
    }
  });

  // ---------------------------------------------------
  // Detalhe da manutenção (tela expandida) + O.S. da manutenção
  // gestor e suporte veem todas as O.S. | demais: só as do seu time
  // ---------------------------------------------------
  router.get("/:manutencaoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;
    const manutencaoId = String(req.params.manutencaoId);

    if (!/^\d+$/.test(manutencaoId)) {
      return res.status(404).json({ message: "Manutenção não encontrada." });
    }

    try {
      const filtro = filtroManutencao(user);

      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_MANUTENCAO} WHERE m.manutencao_id = ? AND ${filtro.sql} LIMIT 1`,
        [manutencaoId, ...filtro.params],
      );
      const m = rows[0];
      if (!m) return res.status(404).json({ message: "Manutenção não encontrada." });

      const [equipamentos] = await pool.execute<RowDataPacket[]>(
        `SELECT e.nome_equipamento, i.quantidade
           FROM item_equipamento_manutencao i
           JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
          WHERE i.manutencao_id = ?
          ORDER BY e.nome_equipamento`,
        [manutencaoId],
      );

      const [anexos] = await pool.execute<RowDataPacket[]>(
        `SELECT anexo_id, nome_anexo, anexo_tipo, anexo_tamanho
           FROM anexo
          WHERE manutencao_id = ?
          ORDER BY anexo_id`,
        [manutencaoId],
      );

      const filtroOS = filtroVisibilidadeOS(user);
      const [ordens] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS}
          WHERE o.manutencao_id = ? AND (${filtroOS.sql})
          ORDER BY o.data_criacao DESC, o.os_id DESC`,
        [manutencaoId, ...filtroOS.params],
      );

      return res.json({
        manutencao: {
          ...mapManutencaoResumo(m),
          tipo_manutencao: m.tipo_manutencao as string,
          data_limite: (m.data_limite as string | null) ?? null,
          projeto:
            m.projeto_id === null
              ? null
              : { id: String(m.projeto_id), nome: m.projeto_nome as string },
          descricao: (m.descricao_situacao as string | null) ?? "",
          data_inicio_problema: m.data_inicio_problema as string | null,
          equipamentos: equipamentos.map((e) => ({
            nome: e.nome_equipamento as string,
            quantidade: Number(e.quantidade),
          })),
          anexos: anexos.map((a) => ({
            id: String(a.anexo_id),
            nome: a.nome_anexo as string,
            tipo: a.anexo_tipo as string,
            tamanho: Number(a.anexo_tamanho ?? 0),
          })),
          ordens: ordens.map(mapOS),
        },
      });
    } catch (error) {
      console.error("Erro ao carregar manutenção:", error);
      return res.status(500).json({ message: "Não foi possível carregar a manutenção." });
    }
  });

  // ---------------------------------------------------
  // Download de anexo (mesma regra de acesso do detalhe)
  // ---------------------------------------------------
  router.get("/:manutencaoId/anexos/:anexoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    try {
      const filtro = filtroManutencao(user);

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo
           FROM anexo a
           JOIN manutencoes m ON m.manutencao_id = a.manutencao_id
          WHERE a.anexo_id = ? AND a.manutencao_id = ? AND ${filtro.sql}
          LIMIT 1`,
        [String(req.params.anexoId), String(req.params.manutencaoId), ...filtro.params],
      );

      const anexo = rows[0];
      if (!anexo) return res.status(404).json({ message: "Anexo não encontrado." });

      res.setHeader("Content-Type", anexo.anexo_tipo || "application/octet-stream");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(anexo.nome_anexo as string)}`,
      );
      return res.send(anexo.conteudo_arquivo as Buffer);
    } catch (error) {
      console.error("Erro ao baixar anexo:", error);
      return res.status(500).json({ message: "Não foi possível baixar o anexo." });
    }
  });

  // ---------------------------------------------------
  // Criação (aba "Nova manutenção") - somente suporte
  // ---------------------------------------------------
  router.post("/", requireRole("suporte"), async (req, res) => {
    const user = res.locals.user as User;
    const {
      resumo,
      tipo_manutencao,
      projeto_id,
      id_time_responsavel,
      data_limite,
      data_inicio_problema,
      prioridade,
      descricao_situacao,
      equipamentos = [],
      anexos = [],
    } = (req.body ?? {}) as {
      resumo?: string;
      tipo_manutencao?: string;
      projeto_id?: string | number | null;
      id_time_responsavel?: string | number;
      data_limite?: string;
      data_inicio_problema?: string;
      prioridade?: string;
      descricao_situacao?: string;
      equipamentos?: { nome_equipamento?: string; quantidade?: number }[];
      anexos?: {
        nome_anexo?: string;
        anexo_tipo?: string;
        anexo_tamanho?: number;
        conteudo_arquivo_base64?: string;
      }[];
    };

    if (!resumo?.trim() || resumo.trim().length > 255) {
      return res.status(400).json({ message: "Informe um resumo válido (até 255 caracteres)." });
    }
    if (!tipo_manutencao || !TIPOS.includes(tipo_manutencao as Tipo)) {
      return res.status(400).json({ message: "Tipo de manutenção inválido." });
    }
    if (!data_limite || !dataValida(data_limite)) {
      return res.status(400).json({ message: "Informe uma data limite válida." });
    }
    if (projeto_id && !/^\d+$/.test(String(projeto_id))) {
      return res.status(400).json({ message: "Projeto inválido." });
    }
    if (id_time_responsavel !== undefined && !/^\d+$/.test(String(id_time_responsavel))) {
      return res.status(400).json({ message: "Time responsável inválido." });
    }
    if (!data_inicio_problema || !dataValida(data_inicio_problema)) {
      return res.status(400).json({ message: "Data de início inválida." });
    }
    const prioridadeFinal = (prioridade ?? "").toLowerCase() as Prioridade;
    if (!PRIORIDADES.includes(prioridadeFinal)) {
      return res.status(400).json({ message: "Prioridade inválida." });
    }
    if (!descricao_situacao?.trim() || descricao_situacao.length > 5000) {
      return res.status(400).json({ message: "Informe a descrição (até 5000 caracteres)." });
    }
    if (!Array.isArray(equipamentos) || !Array.isArray(anexos)) {
      return res.status(400).json({ message: "Equipamentos ou anexos em formato inválido." });
    }

    try {
      let projetoNome: string | null = null;
      let timeResponsavelId = id_time_responsavel === undefined ? null : String(id_time_responsavel);
      if (projeto_id) {
        const [projetos] = await pool.execute<RowDataPacket[]>(
          `SELECT projeto_id, nome, id_time_responsavel
             FROM projetos
            WHERE projeto_id = ?
            LIMIT 1`,
          [String(projeto_id)],
        );
        if (!projetos.length) return res.status(400).json({ message: "Projeto não encontrado." });
        projetoNome = projetos[0].nome as string;
        if (projetos[0].id_time_responsavel !== null) {
          timeResponsavelId = String(projetos[0].id_time_responsavel);
        }
      }
      if (!timeResponsavelId) {
        return res.status(400).json({ message: "Selecione o time responsável pela manutenção." });
      }
      const [times] = await pool.execute<RowDataPacket[]>(
        "SELECT id_time, nome_time FROM time WHERE id_time = ? LIMIT 1",
        [timeResponsavelId],
      );
      const time = times[0];
      if (!time) return res.status(400).json({ message: "Time responsável inválido." });

      const itens = new Map<string, { nome: string; quantidade: number }>();
      for (const equipamento of equipamentos) {
        const equipamentoNome = equipamento?.nome_equipamento?.trim();
        const quantidade = Number(equipamento?.quantidade);
        if (!equipamentoNome || equipamentoNome.length > 150 || !Number.isInteger(quantidade) || quantidade < 1) {
          return res.status(400).json({ message: "Informe equipamentos válidos e quantidades positivas." });
        }
        const key = equipamentoNome.toLocaleLowerCase();
        const existing = itens.get(key);
        if (existing) existing.quantidade += quantidade;
        else itens.set(key, { nome: equipamentoNome, quantidade });
      }

      const arquivos: { nome: string; tipo: string; tamanho: number; conteudo: Buffer }[] = [];
      let tamanhoTotal = 0;
      for (const anexo of anexos) {
        const anexoNome = anexo?.nome_anexo?.trim();
        const anexoTipo = anexo?.anexo_tipo?.trim() || "application/octet-stream";
        const base64 = anexo?.conteudo_arquivo_base64;
        if (
          !anexoNome ||
          anexoNome.length > 255 ||
          anexoTipo.length > 150 ||
          typeof base64 !== "string" ||
          !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
        ) {
          return res.status(400).json({ message: "Um dos anexos está inválido." });
        }
        const conteudo = Buffer.from(base64, "base64");
        tamanhoTotal += conteudo.length;
        if (tamanhoTotal > 18 * 1024 * 1024) {
          return res.status(400).json({ message: "O total de anexos não pode ultrapassar 18 MB." });
        }
        arquivos.push({ nome: anexoNome, tipo: anexoTipo, tamanho: anexo.anexo_tamanho || conteudo.length, conteudo });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO manutencoes
            (data_inicio_problema, tipo_manutencao, descricao_situacao, status, prioridade,
             resumo, responsavel_id, id_time_responsavel, projeto_id, data_limite)
           VALUES (?, ?, ?, 'aberta', ?, ?, ?, ?, ?, ?)`,
          [
            data_inicio_problema,
            tipo_manutencao,
            descricao_situacao.trim(),
            prioridadeFinal,
            resumo.trim(),
            user.id, // responsável = usuário logado (suporte)
            time.id_time,
            projeto_id ? String(projeto_id) : null,
            data_limite,
          ],
        );
        const manutencaoId = result.insertId;

        for (const item of itens.values()) {
          await connection.execute("INSERT IGNORE INTO equipamentos (nome_equipamento) VALUES (?)", [item.nome]);
          const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT equipamento_id FROM equipamentos WHERE LOWER(nome_equipamento) = LOWER(?) LIMIT 1",
            [item.nome],
          );
          const equipamentoId = rows[0]?.equipamento_id;
          if (!equipamentoId) throw new Error("Não foi possível registrar um equipamento.");
          await connection.execute(
            `INSERT INTO item_equipamento_manutencao (manutencao_id, equipamento_id, quantidade)
             VALUES (?, ?, ?)`,
            [manutencaoId, equipamentoId, item.quantidade],
          );
        }

        for (const arquivo of arquivos) {
          await connection.execute(
            `INSERT INTO anexo
              (os_id, nome_anexo, anexo_tipo, anexo_tamanho, manutencao_id, projeto_id, conteudo_arquivo)
             VALUES (NULL, ?, ?, ?, ?, NULL, ?)`,
            [arquivo.nome, arquivo.tipo, arquivo.tamanho, manutencaoId, arquivo.conteudo],
          );
        }

        const [contextRows] = await connection.execute<RowDataPacket[]>(
          `SELECT u.nome AS criador_nome,
                  DATE_FORMAT(m.data_criacao, '%d/%m/%Y %H:%i:%s') AS data_criacao
             FROM manutencoes m
             LEFT JOIN usuarios u ON u.id_usuario = ?
            WHERE m.manutencao_id = ?
            LIMIT 1`,
          [user.id, manutencaoId],
        );
        const contexto = contextRows[0];
        await createNotificationsForTime(connection, {
          titulo: "Nova manutenção",
          mensagem: buildMaintenanceCreatedNotificationMessage(
            resumo.trim(),
            manutencaoId,
            projetoNome,
            time.nome_time as string,
            (contexto?.criador_nome as string | undefined) ?? "Usuário",
            (contexto?.data_criacao as string | undefined) ?? "data não informada",
          ),
          timeId: Number(time.id_time),
          manutencaoId,
          usuarioOrigemId: user.id,
        });

        await connection.commit();
        return res.status(201).json({
          message: "Manutenção criada com sucesso!",
          manutencao: { manutencao_id: manutencaoId, status: "aberta" },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao criar manutenção:", error);
      return res.status(500).json({ message: "Não foi possível criar a manutenção." });
    }
  });

  return router;
}