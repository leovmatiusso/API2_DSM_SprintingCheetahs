import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";

// Perfis que enxergam todas as O.S. Os demais (exceto superusuário)
// só enxergam O.S. cujo "time responsável" é o seu próprio time.
const PERFIS_VEEM_TODOS: Role[] = ["gestor"];
const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
];

const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
type Prioridade = (typeof PRIORIDADES)[number];

type RequireRole = (...roles: Role[]) => RequestHandler;

function veTodos(user: User): boolean {
  return PERFIS_VEEM_TODOS.includes(user.role);
}

function podeVerOS(user: User, timeIdDaOS: number | null): boolean {
  if (veTodos(user)) return true;
  if (timeIdDaOS === null || user.time_id === null) return false;
  return String(timeIdDaOS) === String(user.time_id);
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

const SELECT_OS = `
  SELECT o.os_id,
         o.os_titulo,
         o.os_descricao,
         o.os_status,
         o.prioridade,
         o.id_time_responsavel,
         t.nome_time,
         t.departamento,
         c.nome AS criador_nome,
         DATE_FORMAT(o.data_limite, '%Y-%m-%d') AS data_limite,
         DATE_FORMAT(o.data_criacao, '%Y-%m-%d') AS data_criacao
    FROM os o
    LEFT JOIN time t ON t.id_time = o.id_time_responsavel
    LEFT JOIN usuarios c ON c.id_usuario = o.id_criador`;

function mapOS(o: RowDataPacket) {
  return {
    id: String(o.os_id),
    titulo: o.os_titulo as string,
    descricao: (o.os_descricao as string) ?? "",
    status: o.os_status as string,
    prioridade: o.prioridade as string,
    data_limite: (o.data_limite as string | null) ?? null,
    data_criacao: (o.data_criacao as string | null) ?? null,
    criador: (o.criador_nome as string | null) ?? null,
    departamento: (o.departamento as string | null) ?? null,
    time:
      o.id_time_responsavel === null
        ? null
        : { id: String(o.id_time_responsavel), nome: o.nome_time as string },
  };
}

export function createOrdensRouter(requireRole: RequireRole): Router {
  const router = Router();

  // ---------------------------------------------------
  // Listagem (aba "Ordens disponíveis")
  // gestor: todas | demais: apenas as do seu time
  // ---------------------------------------------------
  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const params: number[] = [];
      let filtro = "";

      if (!veTodos(user)) {
        if (user.time_id === null) return res.json({ ordens: [] });
        filtro = "WHERE o.id_time_responsavel = ?";
        params.push(Number(user.time_id));
      }

      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS} ${filtro} ORDER BY o.data_criacao DESC, o.os_id DESC`,
        params,
      );

      return res.json({ ordens: rows.map(mapOS) });
    } catch (error) {
      console.error("Erro ao listar O.S.:", error);
      return res.status(500).json({ message: "Não foi possível carregar as ordens de serviço." });
    }
  });

  // ---------------------------------------------------
  // Detalhe de uma O.S. (tela expandida)
  // ---------------------------------------------------
  router.get("/:osId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    if (!/^\d+$/.test(req.params.osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS} WHERE o.os_id = ? LIMIT 1`,
        [req.params.osId],
      );

      const os = rows[0];
      if (!os || !podeVerOS(user, os.id_time_responsavel as number | null)) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      const [equipamentos] = await pool.execute<RowDataPacket[]>(
        `SELECT e.nome_equipamento, i.quantidade
           FROM item_equipamento_os i
           JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
          WHERE i.os_id = ?
          ORDER BY e.nome_equipamento`,
        [os.os_id],
      );

      const [anexos] = await pool.execute<RowDataPacket[]>(
        `SELECT anexo_id, nome_anexo, anexo_tipo, anexo_tamanho
           FROM anexo
          WHERE os_id = ?
          ORDER BY anexo_id`,
        [os.os_id],
      );

      return res.json({
        ordem: {
          ...mapOS(os),
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
        },
      });
    } catch (error) {
      console.error("Erro ao carregar O.S.:", error);
      return res.status(500).json({ message: "Não foi possível carregar a ordem de serviço." });
    }
  });

  // ---------------------------------------------------
  // Download de anexo (mesma regra de acesso)
  // ---------------------------------------------------
  router.get("/:osId/anexos/:anexoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo, o.id_time_responsavel
           FROM anexo a
           JOIN os o ON o.os_id = a.os_id
          WHERE a.anexo_id = ? AND a.os_id = ?
          LIMIT 1`,
        [req.params.anexoId, req.params.osId],
      );

      const anexo = rows[0];
      if (!anexo || !podeVerOS(user, anexo.id_time_responsavel as number | null)) {
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
  // Criação (aba "Nova O.S.") - todos, exceto superusuário
  // ---------------------------------------------------
  router.post("/", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    const {
      os_titulo,
      os_descricao,
      prioridade,
      data_limite,
      id_time_responsavel,
      equipamentos = [],
      anexos = [],
    } = (req.body ?? {}) as {
      os_titulo?: string;
      os_descricao?: string;
      prioridade?: string;
      data_limite?: string;
      id_time_responsavel?: string | number;
      equipamentos?: { nome_equipamento?: string; quantidade?: number }[];
      anexos?: {
        nome_anexo?: string;
        anexo_tipo?: string;
        anexo_tamanho?: number;
        conteudo_arquivo_base64?: string;
      }[];
    };

    if (!os_titulo?.trim() || os_titulo.trim().length > 150) {
      return res.status(400).json({ message: "Informe um título válido (até 150 caracteres)." });
    }
    if (!os_descricao?.trim() || os_descricao.length > 5000) {
      return res.status(400).json({ message: "Informe a descrição (até 5000 caracteres)." });
    }
    if (!prioridade || !PRIORIDADES.includes(prioridade.toLowerCase() as Prioridade)) {
      return res.status(400).json({ message: "Prioridade inválida." });
    }
    if (!data_limite || !dataValida(data_limite)) {
      return res.status(400).json({ message: "Informe um prazo válido." });
    }
    if (!id_time_responsavel) {
      return res.status(400).json({ message: "Selecione o time responsável." });
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

      const itens = new Map<string, { nome: string; quantidade: number }>();
      for (const equipamento of equipamentos) {
        const nome = equipamento?.nome_equipamento?.trim();
        const quantidade = Number(equipamento?.quantidade);
        if (!nome || nome.length > 150 || !Number.isInteger(quantidade) || quantidade < 1) {
          return res.status(400).json({ message: "Informe equipamentos válidos e quantidades positivas." });
        }
        const key = nome.toLocaleLowerCase();
        const existing = itens.get(key);
        if (existing) existing.quantidade += quantidade;
        else itens.set(key, { nome, quantidade });
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
          `INSERT INTO os
            (os_titulo, os_descricao, os_status, prioridade, data_limite, id_criador, id_time_responsavel)
           VALUES (?, ?, 'aberta', ?, ?, ?, ?)`,
          [
            os_titulo.trim(),
            os_descricao.trim(),
            prioridade.toLowerCase(),
            data_limite,
            user.id,
            time.id_time,
          ],
        );
        const osId = result.insertId;

        for (const item of itens.values()) {
          await connection.execute("INSERT IGNORE INTO equipamentos (nome_equipamento) VALUES (?)", [item.nome]);
          const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT equipamento_id FROM equipamentos WHERE LOWER(nome_equipamento) = LOWER(?) LIMIT 1",
            [item.nome],
          );
          const equipamentoId = rows[0]?.equipamento_id;
          if (!equipamentoId) throw new Error("Não foi possível registrar um equipamento.");
          await connection.execute(
            `INSERT INTO item_equipamento_os (os_id, equipamento_id, quantidade) VALUES (?, ?, ?)`,
            [osId, equipamentoId, item.quantidade],
          );
        }

        for (const arquivo of arquivos) {
          await connection.execute(
            `INSERT INTO anexo
              (os_id, nome_anexo, anexo_tipo, anexo_tamanho, manutencao_id, projeto_id, conteudo_arquivo)
             VALUES (?, ?, ?, ?, NULL, NULL, ?)`,
            [osId, arquivo.nome, arquivo.tipo, arquivo.tamanho, arquivo.conteudo],
          );
        }

        await connection.commit();
        return res.status(201).json({
          message: "Ordem de serviço aberta com sucesso!",
          os: { os_id: osId, os_status: "aberta" },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao abrir O.S.:", error);
      return res.status(500).json({ message: "Erro ao abrir a ordem de serviço." });
    }
  });

  return router;
}