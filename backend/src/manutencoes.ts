import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import { SELECT_OS, filtroVisibilidadeOS, mapOS, statusDoItem } from "./os_comum.js";

const PERFIS_VEEM_TODOS: Role[] = ["gestor", "suporte", "superusuario"];
const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "suporte",
  "producao",
  "software",
  "implantacao",
  "monitoramento",
];

const TIPOS = ["preventiva", "corretiva", "adaptativa", "evolutiva"] as const;
// O superusuário consulta e edita todas as manutenções (e cria O.S. dentro delas).
const PERFIS_CONSULTA: Role[] = [...PERFIS_COM_ACESSO, "superusuario"];

const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
const STATUS_MANUTENCAO = ["aberta", "em_andamento", "concluida", "cancelada"] as const;
const PERFIS_CONCLUEM_MANUTENCAO: Role[] = ["gestor", "superusuario", "suporte"];

type Tipo = (typeof TIPOS)[number];
type Prioridade = (typeof PRIORIDADES)[number];
type StatusManutencao = (typeof STATUS_MANUTENCAO)[number];

type RequireRole = (...roles: Role[]) => RequestHandler;

function veTodos(user: User): boolean {
  return PERFIS_VEEM_TODOS.includes(user.role);
}

function filtroManutencao(user: User): { sql: string; params: number[] } {
  if (veTodos(user)) return { sql: "1 = 1", params: [] };
  if (user.time_id === null) return { sql: "1 = 0", params: [] };
  return {
    sql: `EXISTS (SELECT 1 FROM os ox
                   WHERE ox.manutencao_id = m.manutencao_id AND ox.id_time_responsavel = ?)`,
    params: [Number(user.time_id)],
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
    status_manutencao: (m.status_manutencao as string) ?? "aberta",
    responsavel: (m.responsavel_nome as string | null) ?? null,
    status:
      m.status_manutencao === "cancelada"
        ? "cancelado"
        : statusDoItem(Number(m.total_os), Number(m.os_nao_concluidas)),
  };
}

export function createManutencoesRouter(requireRole: RequireRole): Router {
  const router = Router();

  // Lista de projetos para vincular a manutenção (criação e edição).
  router.get("/projetos", requireRole(...PERFIS_CONSULTA), async (_req, res) => {
    try {
      const [projetos] = await pool.execute<RowDataPacket[]>(
        `SELECT projeto_id AS id_projeto, nome
           FROM projetos
          ORDER BY nome`,
      );
      return res.json({ projetos });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Não foi possível carregar os projetos." });
    }
  });

  router.get("/", requireRole(...PERFIS_CONSULTA), async (_req, res) => {
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

  router.get("/:manutencaoId", requireRole(...PERFIS_CONSULTA), async (req, res) => {
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
          status_manutencao: m.status_manutencao as string,
          data_limite: (m.data_limite as string | null) ?? null,
          projeto:
            m.projeto_id === null
              ? null
              : { id: String(m.projeto_id), nome: m.projeto_nome as string },
          descricao: (m.descricao_situacao as string | null) ?? "",
          data_inicio_problema: m.data_inicio_problema as string | null,
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

  router.get("/:manutencaoId/anexos/:anexoId", requireRole(...PERFIS_CONSULTA), async (req, res) => {
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

  router.post("/", requireRole("suporte"), async (req, res) => {
    const user = res.locals.user as User;
    const {
      resumo,
      tipo_manutencao,
      projeto_id,
      data_limite,
      data_inicio_problema,
      prioridade,
      status_manutencao,
      descricao_situacao,
      anexos = [],
    } = (req.body ?? {}) as {
      resumo?: string;
      tipo_manutencao?: string;
      projeto_id?: string | number | null;
      data_limite?: string;
      data_inicio_problema?: string;
      prioridade?: string;
      status_manutencao?: string;
      descricao_situacao?: string;
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
    if (!data_inicio_problema || !dataValida(data_inicio_problema)) {
      return res.status(400).json({ message: "Data de início inválida." });
    }
    const prioridadeFinal = (prioridade ?? "").toLowerCase() as Prioridade;
    if (!PRIORIDADES.includes(prioridadeFinal)) {
      return res.status(400).json({ message: "Prioridade inválida." });
    }
    const statusFinal = (status_manutencao ?? "aberta").toLowerCase() as StatusManutencao;
    if (!STATUS_MANUTENCAO.includes(statusFinal)) {
      return res.status(400).json({ message: "Status de manutenção inválido." });
    }
    if (!descricao_situacao?.trim() || descricao_situacao.length > 5000) {
      return res.status(400).json({ message: "Informe a descrição (até 5000 caracteres)." });
    }
    if (!Array.isArray(anexos)) {
      return res.status(400).json({ message: "Anexos em formato inválido." });
    }

    try {
      if (projeto_id) {
        const [projetos] = await pool.execute<RowDataPacket[]>(
          `SELECT projeto_id
             FROM projetos
            WHERE projeto_id = ?
            LIMIT 1`,
          [String(projeto_id)],
        );
        if (!projetos.length) return res.status(400).json({ message: "Projeto não encontrado." });
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
             resumo, responsavel_id, projeto_id, data_limite)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data_inicio_problema,
            tipo_manutencao,
            descricao_situacao.trim(),
            statusFinal,
            prioridadeFinal,
            resumo.trim(),
            user.id,
            projeto_id ? String(projeto_id) : null,
            data_limite,
          ],
        );
        const manutencaoId = result.insertId;

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
          manutencao: { manutencao_id: manutencaoId, status: statusFinal },
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

  router.put("/:manutencaoId", requireRole(...PERFIS_CONSULTA), async (req, res) => {
    const user = res.locals.user as User;
    const manutencaoId = String(req.params.manutencaoId);

    if (!/^\d+$/.test(manutencaoId)) {
      return res.status(404).json({ message: "Manutenção não encontrada." });
    }

    const {
      resumo,
      tipo_manutencao,
      projeto_id,
      data_limite,
      data_inicio_problema,
      prioridade,
      status_manutencao,
      descricao_situacao,
    } = (req.body ?? {}) as Record<string, unknown>;

    try {
      const [existentes] = await pool.execute<RowDataPacket[]>(
        `${SELECT_MANUTENCAO} WHERE m.manutencao_id = ? LIMIT 1`,
        [manutencaoId],
      );
      const atual = existentes[0];
      if (!atual) {
        return res.status(404).json({ message: "Manutenção não encontrada." });
      }

      // Somente gestor, superusuário e suporte concluem a manutenção; os demais mudam para os outros estados.
      if (
        typeof status_manutencao === "string" &&
        status_manutencao.toLowerCase() === "concluida" &&
        atual.status_manutencao !== "concluida" &&
        !PERFIS_CONCLUEM_MANUTENCAO.includes(user.role)
      ) {
        return res.status(403).json({
          message: "Somente gestor, superusuário ou suporte podem concluir a manutenção.",
        });
      }

      const sets: string[] = [];
      const valores: (string | number | null)[] = [];

      if (resumo !== undefined) {
        if (typeof resumo !== "string" || !resumo.trim() || resumo.trim().length > 255) {
          return res.status(400).json({ message: "Informe um resumo válido (até 255 caracteres)." });
        }
        sets.push("resumo = ?");
        valores.push(resumo.trim());
      }

      if (tipo_manutencao !== undefined) {
        if (typeof tipo_manutencao !== "string" || !TIPOS.includes(tipo_manutencao as Tipo)) {
          return res.status(400).json({ message: "Tipo de manutenção inválido." });
        }
        sets.push("tipo_manutencao = ?");
        valores.push(tipo_manutencao);
      }

      if (data_limite !== undefined) {
        if (typeof data_limite !== "string" || !dataValida(data_limite)) {
          return res.status(400).json({ message: "Informe uma data limite válida." });
        }
        sets.push("data_limite = ?");
        valores.push(data_limite);
      }

      if (data_inicio_problema !== undefined) {
        if (typeof data_inicio_problema !== "string" || !dataValida(data_inicio_problema)) {
          return res.status(400).json({ message: "Data de início inválida." });
        }
        sets.push("data_inicio_problema = ?");
        valores.push(data_inicio_problema);
      }

      if (prioridade !== undefined) {
        if (typeof prioridade !== "string" || !PRIORIDADES.includes(prioridade.toLowerCase() as Prioridade)) {
          return res.status(400).json({ message: "Prioridade inválida." });
        }
        sets.push("prioridade = ?");
        valores.push(prioridade.toLowerCase());
      }

      if (status_manutencao !== undefined) {
        if (typeof status_manutencao !== "string" || !STATUS_MANUTENCAO.includes(status_manutencao.toLowerCase() as StatusManutencao)) {
          return res.status(400).json({ message: "Status de manutenção inválido." });
        }
        sets.push("status = ?");
        valores.push(status_manutencao.toLowerCase());
      }

      if (descricao_situacao !== undefined) {
        if (typeof descricao_situacao !== "string" || !descricao_situacao.trim() || descricao_situacao.length > 5000) {
          return res.status(400).json({ message: "Informe a descrição (até 5000 caracteres)." });
        }
        sets.push("descricao_situacao = ?");
        valores.push(descricao_situacao.trim());
      }

      if (projeto_id !== undefined) {
        if (projeto_id === null || projeto_id === "") {
          sets.push("projeto_id = ?");
          valores.push(null);
        } else {
          const novoProjeto = String(projeto_id);
          if (!/^\d+$/.test(novoProjeto)) {
            return res.status(400).json({ message: "Projeto inválido." });
          }
          const [projetos] = await pool.execute<RowDataPacket[]>(
            "SELECT projeto_id FROM projetos WHERE projeto_id = ? LIMIT 1",
            [novoProjeto],
          );
          if (!projetos[0]) {
            return res.status(400).json({ message: "Projeto não encontrado." });
          }
          sets.push("projeto_id = ?");
          valores.push(Number(novoProjeto));
        }
      }


      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        if (sets.length > 0) {
          await connection.execute(`UPDATE manutencoes SET ${sets.join(", ")} WHERE manutencao_id = ?`, [
            ...valores,
            manutencaoId,
          ]);
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [rows] = await pool.execute<RowDataPacket[]>(`${SELECT_MANUTENCAO} WHERE m.manutencao_id = ? LIMIT 1`, [
        manutencaoId,
      ]);
      const m = rows[0];

      return res.json({
        message: "Manutenção atualizada com sucesso.",
        manutencao: {
          ...mapManutencaoResumo(m),
          tipo_manutencao: m.tipo_manutencao as string,
          status_manutencao: m.status_manutencao as string,
          data_limite: (m.data_limite as string | null) ?? null,
          projeto:
            m.projeto_id === null
              ? null
              : { id: String(m.projeto_id), nome: m.projeto_nome as string },
          descricao: (m.descricao_situacao as string | null) ?? "",
          data_inicio_problema: m.data_inicio_problema as string | null,
        },
      });
    } catch (error) {
      console.error("Erro ao editar manutenção:", error);
      return res.status(500).json({ message: "Não foi possível atualizar a manutenção." });
    }
  });

  return router;
}
