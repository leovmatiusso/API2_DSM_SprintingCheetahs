import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import { SELECT_OS, filtroVisibilidadeOS, mapOS, statusDoItem } from "./os_comum.js";

const PERFIS_VEEM_TODOS: Role[] = ["gestor", "comercial"];
const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "comercial",
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

function filtroProjeto(user: User): { sql: string; params: number[] } {
  if (veTodos(user)) return { sql: "1 = 1", params: [] };
  if (user.time_id === null) return { sql: "1 = 0", params: [] };
  return {
    sql: `EXISTS (SELECT 1 FROM os ox
                   WHERE ox.projeto_id = p.projeto_id AND ox.id_time_responsavel = ?)`,
    params: [Number(user.time_id)],
  };
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

const SELECT_PROJETO = `
  SELECT p.projeto_id,
         p.nome,
         p.tipo_sistema,
         p.prioridade,
         p.descricao,
         DATE_FORMAT(p.data_limite, '%Y-%m-%d') AS data_limite,
         resp.nome AS responsavel_nome,
         vend.nome AS vendedor_nome,
         DATE_FORMAT(p.data_assinatura_contrato, '%Y-%m-%d') AS data_assinatura_contrato,
         DATE_FORMAT(p.data_vencimento_contrato, '%Y-%m-%d') AS data_vencimento_contrato,
         (SELECT COUNT(*) FROM os o WHERE o.projeto_id = p.projeto_id) AS total_os,
         (SELECT COUNT(*) FROM os o
           WHERE o.projeto_id = p.projeto_id AND o.os_status <> 'concluida') AS os_nao_concluidas
    FROM projetos p
    LEFT JOIN usuarios resp ON resp.id_usuario = p.responsavel_id
    LEFT JOIN usuarios vend ON vend.id_usuario = p.vendedor_id`;

function mapProjetoResumo(p: RowDataPacket) {
  return {
    id: String(p.projeto_id),
    nome: p.nome as string,
    prioridade: p.prioridade as string,
    responsavel: ((p.responsavel_nome ?? p.vendedor_nome) as string | null) ?? null,
    vendedor: (p.vendedor_nome as string | null) ?? null,
    status: statusDoItem(Number(p.total_os), Number(p.os_nao_concluidas)),
  };
}

export function createProjetosRouter(requireRole: RequireRole): Router {
  const router = Router();

router.get("/vendedores", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    try {
      const [vendedores] = await pool.execute<(RowDataPacket & { id_usuario: number; nome: string })[]>(
        "SELECT id_usuario, nome FROM usuarios WHERE cargo = 'comercial' AND ativo = TRUE ORDER BY nome",
      );
      return res.json({ vendedores });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Não foi possível carregar os vendedores." });
    }
  });

  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const filtro = filtroProjeto(user);

      const [projetos] = await pool.execute<RowDataPacket[]>(
        `${SELECT_PROJETO}
          WHERE ${filtro.sql}
          ORDER BY p.data_criacao DESC, p.projeto_id DESC`,
        filtro.params,
      );

      return res.json({ projetos: projetos.map(mapProjetoResumo) });
    } catch (error) {
      console.error("Erro ao listar projetos:", error);
      return res.status(500).json({ message: "Não foi possível carregar os projetos." });
    }
  });

  router.get("/:projetoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;
    const projetoId = String(req.params.projetoId);

    if (!/^\d+$/.test(projetoId)) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    try {
      const filtro = filtroProjeto(user);

      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_PROJETO} WHERE p.projeto_id = ? AND ${filtro.sql} LIMIT 1`,
        [projetoId, ...filtro.params],
      );
      const p = rows[0];
      if (!p) return res.status(404).json({ message: "Projeto não encontrado." });

      const [equipamentos] = await pool.execute<RowDataPacket[]>(
        `SELECT e.nome_equipamento, i.quantidade
           FROM item_equipamento_projeto i
           JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
          WHERE i.projeto_id = ?
          ORDER BY e.nome_equipamento`,
        [projetoId],
      );

      const [anexos] = await pool.execute<RowDataPacket[]>(
        `SELECT anexo_id, nome_anexo, anexo_tipo, anexo_tamanho
           FROM anexo
          WHERE projeto_id = ?
          ORDER BY anexo_id`,
        [projetoId],
      );

      const filtroOS = filtroVisibilidadeOS(user);
      const [ordens] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS}
          WHERE o.projeto_id = ? AND (${filtroOS.sql})
          ORDER BY o.data_criacao DESC, o.os_id DESC`,
        [projetoId, ...filtroOS.params],
      );

      return res.json({
        projeto: {
          ...mapProjetoResumo(p),
          tipo_sistema: p.tipo_sistema as string,
          descricao: (p.descricao as string | null) ?? "",
          data_assinatura_contrato: p.data_assinatura_contrato as string | null,
          data_vencimento_contrato: p.data_vencimento_contrato as string | null,
          data_limite: (p.data_limite as string | null) ?? null,
          vendedor: (p.vendedor_nome as string | null) ?? null,
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
      console.error("Erro ao carregar projeto:", error);
      return res.status(500).json({ message: "Não foi possível carregar o projeto." });
    }
  });

  router.get("/:projetoId/anexos/:anexoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    try {
      const filtro = filtroProjeto(user);

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo
           FROM anexo a
           JOIN projetos p ON p.projeto_id = a.projeto_id
          WHERE a.anexo_id = ? AND a.projeto_id = ? AND ${filtro.sql}
          LIMIT 1`,
        [String(req.params.anexoId), String(req.params.projetoId), ...filtro.params],
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

  router.post("/", requireRole("comercial"), async (req, res) => {
    const user = res.locals.user as User;
    const {
      nome,
      data_assinatura_contrato,
      data_vencimento_contrato,
      data_limite,
      tipo_sistema,
      vendedor_nome,
      prioridade,
      descricao,
      equipamentos = [],
      anexos = [],
    } = req.body as {
      nome?: string;
      data_assinatura_contrato?: string;
      data_vencimento_contrato?: string;
      data_limite?: string;
      tipo_sistema?: string;
      vendedor_nome?: string;
      prioridade?: string;
      descricao?: string;
      equipamentos?: { nome_equipamento?: string; quantidade?: number }[];
      anexos?: {
        nome_anexo?: string;
        anexo_tipo?: string;
        anexo_tamanho?: number;
        conteudo_arquivo_base64?: string;
      }[];
    };

    if (!nome?.trim() || nome.trim().length > 150) {
      return res.status(400).json({ message: "Informe um nome de projeto válido." });
    }
    if (
      !data_assinatura_contrato ||
      !dataValida(data_assinatura_contrato) ||
      !data_vencimento_contrato ||
      !dataValida(data_vencimento_contrato)
    ) {
      return res.status(400).json({ message: "Informe datas válidas para assinatura e vencimento." });
    }
    if (!data_limite || !dataValida(data_limite)) {
      return res.status(400).json({ message: "Informe uma data limite válida." });
    }
    if (!tipo_sistema?.trim() || tipo_sistema.trim().length > 100) {
      return res.status(400).json({ message: "Informe o tipo de sistema." });
    }
    if (!vendedor_nome?.trim()) {
      return res.status(400).json({ message: "O vendedor responsável é obrigatório." });
    }
    const prioridadeFinal = (prioridade ?? "media").toLowerCase() as Prioridade;
    if (!PRIORIDADES.includes(prioridadeFinal)) {
      return res.status(400).json({ message: "Prioridade inválida." });
    }
    if (descricao !== undefined && (typeof descricao !== "string" || descricao.length > 5000)) {
      return res.status(400).json({ message: "A descrição deve ter no máximo 5000 caracteres." });
    }
    if (!Array.isArray(equipamentos) || !Array.isArray(anexos)) {
      return res.status(400).json({ message: "Equipamentos ou anexos em formato inválido." });
    }

    try {
      const [vendedores] = await pool.execute<RowDataPacket[]>(
        `SELECT id_usuario, ativo
           FROM usuarios
          WHERE cargo = 'comercial' AND (LOWER(nome) = LOWER(?) OR LOWER(email) = LOWER(?))
          LIMIT 1`,
        [vendedor_nome.trim(), vendedor_nome.trim()],
      );
      if (!vendedores.length || !Boolean(vendedores[0].ativo)) {
        return res.status(400).json({ message: "Vendedor não encontrado ou inativo." });
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
          `INSERT INTO projetos
            (nome, data_assinatura_contrato, data_vencimento_contrato, data_limite,
             responsavel_id, vendedor_id, tipo_sistema, prioridade, descricao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nome.trim(),
            data_assinatura_contrato,
            data_vencimento_contrato,
            data_limite,
            vendedores[0].id_usuario,
            vendedores[0].id_usuario,
            tipo_sistema.trim(),
            prioridadeFinal,
            descricao?.trim() || null,
          ],
        );
        const projetoId = result.insertId;

        for (const item of itens.values()) {
          await connection.execute("INSERT IGNORE INTO equipamentos (nome_equipamento) VALUES (?)", [item.nome]);
          const [rows] = await connection.execute<RowDataPacket[]>(
            "SELECT equipamento_id FROM equipamentos WHERE LOWER(nome_equipamento) = LOWER(?) LIMIT 1",
            [item.nome],
          );
          const equipamentoId = rows[0]?.equipamento_id;
          if (!equipamentoId) throw new Error("Não foi possível registrar um equipamento.");
          await connection.execute(
            `INSERT INTO item_equipamento_projeto (projeto_id, equipamento_id, quantidade)
             VALUES (?, ?, ?)`,
            [projetoId, equipamentoId, item.quantidade],
          );
        }

        for (const arquivo of arquivos) {
          await connection.execute(
            `INSERT INTO anexo
              (nome_anexo, anexo_tipo, anexo_tamanho, projeto_id, conteudo_arquivo)
             VALUES (?, ?, ?, ?, ?)`,
            [arquivo.nome, arquivo.tipo, arquivo.tamanho, projetoId, arquivo.conteudo],
          );
        }

        await connection.commit();
        return res.status(201).json({
          message: "Projeto criado com sucesso!",
          projeto: { projeto_id: projetoId },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      return res.status(500).json({ message: "Não foi possível criar o projeto." });
    }
  });

  router.put("/:projetoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const projetoId = String(req.params.projetoId);

    if (!/^\d+$/.test(projetoId)) {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }

    const {
      nome,
      data_assinatura_contrato,
      data_vencimento_contrato,
      data_limite,
      tipo_sistema,
      vendedor_nome,
      prioridade,
      descricao,
      equipamentos,
    } = (req.body ?? {}) as Record<string, unknown>;

    try {
      const [existentes] = await pool.execute<RowDataPacket[]>(
        "SELECT projeto_id FROM projetos WHERE projeto_id = ? LIMIT 1",
        [projetoId],
      );
      if (!existentes[0]) {
        return res.status(404).json({ message: "Projeto não encontrado." });
      }

      const sets: string[] = [];
      const valores: (string | number | null)[] = [];

      if (nome !== undefined) {
        if (typeof nome !== "string" || !nome.trim() || nome.trim().length > 150) {
          return res.status(400).json({ message: "Informe um nome de projeto válido." });
        }
        sets.push("nome = ?");
        valores.push(nome.trim());
      }

      if (data_assinatura_contrato !== undefined) {
        if (typeof data_assinatura_contrato !== "string" || !dataValida(data_assinatura_contrato)) {
          return res.status(400).json({ message: "Informe uma data de assinatura válida." });
        }
        sets.push("data_assinatura_contrato = ?");
        valores.push(data_assinatura_contrato);
      }

      if (data_vencimento_contrato !== undefined) {
        if (typeof data_vencimento_contrato !== "string" || !dataValida(data_vencimento_contrato)) {
          return res.status(400).json({ message: "Informe uma data de vencimento válida." });
        }
        sets.push("data_vencimento_contrato = ?");
        valores.push(data_vencimento_contrato);
      }

      if (data_limite !== undefined) {
        if (typeof data_limite !== "string" || !dataValida(data_limite)) {
          return res.status(400).json({ message: "Informe uma data limite válida." });
        }
        sets.push("data_limite = ?");
        valores.push(data_limite);
      }

      if (tipo_sistema !== undefined) {
        if (typeof tipo_sistema !== "string" || !tipo_sistema.trim() || tipo_sistema.trim().length > 100) {
          return res.status(400).json({ message: "Informe o tipo de sistema." });
        }
        sets.push("tipo_sistema = ?");
        valores.push(tipo_sistema.trim());
      }

      if (prioridade !== undefined) {
        if (typeof prioridade !== "string" || !PRIORIDADES.includes(prioridade.toLowerCase() as Prioridade)) {
          return res.status(400).json({ message: "Prioridade inválida." });
        }
        sets.push("prioridade = ?");
        valores.push(prioridade.toLowerCase());
      }

      if (descricao !== undefined) {
        if (typeof descricao !== "string" || descricao.length > 5000) {
          return res.status(400).json({ message: "A descrição deve ter no máximo 5000 caracteres." });
        }
        sets.push("descricao = ?");
        valores.push(descricao.trim() || null);
      }

      if (vendedor_nome !== undefined) {
        if (typeof vendedor_nome !== "string" || !vendedor_nome.trim()) {
          return res.status(400).json({ message: "O vendedor responsável é obrigatório." });
        }
        const [vendedores] = await pool.execute<RowDataPacket[]>(
          `SELECT id_usuario, ativo
             FROM usuarios
            WHERE cargo = 'comercial' AND (LOWER(nome) = LOWER(?) OR LOWER(email) = LOWER(?))
            LIMIT 1`,
          [vendedor_nome.trim(), vendedor_nome.trim()],
        );
        if (!vendedores.length || !Boolean(vendedores[0].ativo)) {
          return res.status(400).json({ message: "Vendedor não encontrado ou inativo." });
        }
        sets.push("responsavel_id = ?", "vendedor_id = ?");
        valores.push(Number(vendedores[0].id_usuario), Number(vendedores[0].id_usuario));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        if (sets.length > 0) {
          await connection.execute(`UPDATE projetos SET ${sets.join(", ")} WHERE projeto_id = ?`, [
            ...valores,
            projetoId,
          ]);
        }

        if (equipamentos !== undefined) {
          if (!Array.isArray(equipamentos)) {
            await connection.rollback();
            return res.status(400).json({ message: "Equipamentos em formato inválido." });
          }

          const itens = new Map<string, { nome: string; quantidade: number }>();
          for (const equipamento of equipamentos as { nome_equipamento?: string; quantidade?: number }[]) {
            const nome = equipamento?.nome_equipamento?.trim();
            const quantidade = Number(equipamento?.quantidade);
            if (!nome || nome.length > 150 || !Number.isInteger(quantidade) || quantidade < 1) {
              await connection.rollback();
              return res.status(400).json({ message: "Informe equipamentos válidos e quantidades positivas." });
            }
            const key = nome.toLocaleLowerCase();
            const existing = itens.get(key);
            if (existing) existing.quantidade += quantidade;
            else itens.set(key, { nome, quantidade });
          }

          await connection.execute("DELETE FROM item_equipamento_projeto WHERE projeto_id = ?", [projetoId]);
          for (const item of itens.values()) {
            await connection.execute("INSERT IGNORE INTO equipamentos (nome_equipamento) VALUES (?)", [item.nome]);
            const [rowsEq] = await connection.execute<RowDataPacket[]>(
              "SELECT equipamento_id FROM equipamentos WHERE LOWER(nome_equipamento) = LOWER(?) LIMIT 1",
              [item.nome],
            );
            const equipamentoId = rowsEq[0]?.equipamento_id;
            if (!equipamentoId) throw new Error("Não foi possível registrar um equipamento.");
            await connection.execute(
              `INSERT INTO item_equipamento_projeto (projeto_id, equipamento_id, quantidade) VALUES (?, ?, ?)`,
              [projetoId, equipamentoId, item.quantidade],
            );
          }
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [rows] = await pool.execute<RowDataPacket[]>(`${SELECT_PROJETO} WHERE p.projeto_id = ? LIMIT 1`, [
        projetoId,
      ]);
      const p = rows[0];

      return res.json({
        message: "Projeto atualizado com sucesso.",
        projeto: {
          ...mapProjetoResumo(p),
          tipo_sistema: p.tipo_sistema as string,
          descricao: (p.descricao as string | null) ?? "",
          data_assinatura_contrato: p.data_assinatura_contrato as string | null,
          data_vencimento_contrato: p.data_vencimento_contrato as string | null,
          data_limite: (p.data_limite as string | null) ?? null,
          vendedor: (p.vendedor_nome as string | null) ?? null,
        },
      });
    } catch (error) {
      console.error("Erro ao editar projeto:", error);
      return res.status(500).json({ message: "Não foi possível atualizar o projeto." });
    }
  });

  return router;
}
