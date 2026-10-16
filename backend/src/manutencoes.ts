import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";

// Perfis que enxergam todas as manutenções. Os demais (exceto superusuário)
// só enxergam manutenções cujo "time responsável" é o seu próprio time.
const PERFIS_VEEM_TODOS: Role[] = ["gestor", "suporte"];
const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "suporte",
  "comercial",
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

function podeVerManutencao(user: User, timeIdDaManutencao: number | null): boolean {
  if (veTodos(user)) return true;
  if (timeIdDaManutencao === null || user.time_id === null) return false;
  return String(timeIdDaManutencao) === String(user.time_id);
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

export function createManutencoesRouter(requireRole: RequireRole): Router {
  const router = Router();

  // ---------------------------------------------------
  // Times disponíveis no formulário "Nova manutenção"
  // ---------------------------------------------------
  router.get("/times", requireRole("suporte"), async (_req, res) => {
    try {
      const [times] = await pool.execute<(RowDataPacket & { id_time: number; nome_time: string })[]>(
        "SELECT id_time, nome_time FROM time ORDER BY nome_time",
      );
      return res.json({ times });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Não foi possível carregar os times." });
    }
  });

  // ---------------------------------------------------
  // Responsáveis (usuários ativos da equipe de suporte)
  // ---------------------------------------------------
  router.get("/responsaveis", requireRole("suporte"), async (_req, res) => {
    try {
      const [responsaveis] = await pool.execute<(RowDataPacket & { id_usuario: number; nome: string })[]>(
        "SELECT id_usuario, nome FROM usuarios WHERE cargo = 'suporte' AND ativo = TRUE ORDER BY nome",
      );
      return res.json({ responsaveis });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Não foi possível carregar os responsáveis." });
    }
  });

  // ---------------------------------------------------
  // Listagem (aba "Manutenções")
  // gestor e suporte: todas | demais: apenas as do seu time
  // ---------------------------------------------------
  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const params: (string | number)[] = [];
      let filtro = "";

      if (!veTodos(user)) {
        if (user.time_id === null) return res.json({ manutencoes: [] });
        filtro = "WHERE m.time_id = ?";
        params.push(Number(user.time_id));
      }

      const [manutencoes] = await pool.execute<RowDataPacket[]>(
        `SELECT m.manutencao_id,
                m.resumo,
                m.tipo_manutencao,
                m.prioridade,
                m.status,
                m.descricao_situacao,
                m.time_id,
                t.nome_time,
                resp.nome AS responsavel_nome,
                DATE_FORMAT(m.data_inicio_problema, '%Y-%m-%d') AS data_inicio_problema
           FROM manutencoes m
           LEFT JOIN time t ON t.id_time = m.time_id
           LEFT JOIN usuarios resp ON resp.id_usuario = m.responsavel_id
           ${filtro}
          ORDER BY m.data_criacao DESC, m.manutencao_id DESC`,
        params,
      );

      if (!manutencoes.length) return res.json({ manutencoes: [] });

      const ids = manutencoes.map((m) => m.manutencao_id as number);

      const [equipamentos] = await pool.query<RowDataPacket[]>(
        `SELECT i.manutencao_id, e.nome_equipamento, i.quantidade
           FROM item_equipamento_manutencao i
           JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
          WHERE i.manutencao_id IN (?)
          ORDER BY e.nome_equipamento`,
        [ids],
      );

      const [anexos] = await pool.query<RowDataPacket[]>(
        `SELECT anexo_id, manutencao_id, nome_anexo, anexo_tipo, anexo_tamanho
           FROM anexo
          WHERE manutencao_id IN (?)
          ORDER BY anexo_id`,
        [ids],
      );

      return res.json({
        manutencoes: manutencoes.map((m) => ({
          id: String(m.manutencao_id),
          resumo: m.resumo ?? "",
          tipo_manutencao: m.tipo_manutencao,
          prioridade: m.prioridade,
          status: m.status,
          descricao: m.descricao_situacao ?? "",
          data_inicio_problema: m.data_inicio_problema,
          responsavel: m.responsavel_nome ?? null,
          time: m.time_id === null ? null : { id: String(m.time_id), nome: m.nome_time },
          equipamentos: equipamentos
            .filter((e) => e.manutencao_id === m.manutencao_id)
            .map((e) => ({ nome: e.nome_equipamento as string, quantidade: Number(e.quantidade) })),
          anexos: anexos
            .filter((a) => a.manutencao_id === m.manutencao_id)
            .map((a) => ({
              id: String(a.anexo_id),
              nome: a.nome_anexo as string,
              tipo: a.anexo_tipo as string,
              tamanho: Number(a.anexo_tamanho ?? 0),
            })),
        })),
      });
    } catch (error) {
      console.error("Erro ao listar manutenções:", error);
      return res.status(500).json({ message: "Não foi possível carregar as manutenções." });
    }
  });

  // ---------------------------------------------------
  // Download de anexo (mesma regra de acesso da listagem)
  // ---------------------------------------------------
  router.get("/:manutencaoId/anexos/:anexoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo, m.time_id
           FROM anexo a
           JOIN manutencoes m ON m.manutencao_id = a.manutencao_id
          WHERE a.anexo_id = ? AND a.manutencao_id = ?
          LIMIT 1`,
        [req.params.anexoId, req.params.manutencaoId],
      );

      const anexo = rows[0];
      if (!anexo || !podeVerManutencao(user, anexo.time_id as number | null)) {
        return res.status(404).json({ message: "Anexo não encontrado." });
      }

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
    const {
      resumo,
      tipo_manutencao,
      responsavel_nome,
      id_time_responsavel,
      data_inicio_problema,
      prioridade,
      descricao_situacao,
      equipamentos = [],
      anexos = [],
    } = (req.body ?? {}) as {
      resumo?: string;
      tipo_manutencao?: string;
      responsavel_nome?: string;
      id_time_responsavel?: string | number;
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
    if (!responsavel_nome?.trim() || !id_time_responsavel) {
      return res.status(400).json({ message: "Responsável e time responsável são obrigatórios." });
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
      const [times] = await pool.execute<RowDataPacket[]>(
        "SELECT id_time FROM time WHERE id_time = ? LIMIT 1",
        [String(id_time_responsavel)],
      );
      const time = times[0];
      if (!time) return res.status(400).json({ message: "Time responsável inválido." });

      const [responsaveis] = await pool.execute<RowDataPacket[]>(
        `SELECT id_usuario, ativo
           FROM usuarios
          WHERE cargo = 'suporte' AND (LOWER(nome) = LOWER(?) OR LOWER(email) = LOWER(?))
          LIMIT 1`,
        [responsavel_nome.trim(), responsavel_nome.trim()],
      );
      if (!responsaveis.length || !Boolean(responsaveis[0].ativo)) {
        return res.status(400).json({ message: "Responsável não encontrado ou inativo." });
      }

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
             resumo, responsavel_id, time_id)
           VALUES (?, ?, ?, 'aberta', ?, ?, ?, ?)`,
          [
            data_inicio_problema,
            tipo_manutencao,
            descricao_situacao.trim(),
            prioridadeFinal,
            resumo.trim(),
            responsaveis[0].id_usuario,
            time.id_time,
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