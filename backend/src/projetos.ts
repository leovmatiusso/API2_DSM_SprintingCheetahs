import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";

// Perfis que enxergam todos os projetos. Os demais (exceto superusuário)
// só enxergam projetos cujo "time responsável" é o seu próprio time.
const PERFIS_VEEM_TODOS: Role[] = ["gestor", "comercial"];
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

function podeVerProjeto(user: User, timeIdDoProjeto: number | null): boolean {
  if (veTodos(user)) return true;
  if (timeIdDoProjeto === null || user.time_id === null) return false;
  return String(timeIdDoProjeto) === String(user.time_id);
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

export function createProjetosRouter(requireRole: RequireRole): Router {
  const router = Router();

  // ---------------------------------------------------
  // Times disponíveis no formulário "Novo projeto"
  // ---------------------------------------------------
  router.get("/times", requireRole("comercial"), async (_req, res) => {
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
  // Vendedores (usuários ativos da equipe comercial) para o formulário
  // ---------------------------------------------------
  router.get("/vendedores", requireRole("comercial"), async (_req, res) => {
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

  // ---------------------------------------------------
  // Listagem (aba "Projetos")
  // gestor e comercial: todos | demais: apenas os do seu time
  // ---------------------------------------------------
  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const params: (string | number)[] = [];
      let filtro = "";

      if (!veTodos(user)) {
        if (user.time_id === null) return res.json({ projetos: [] });
        filtro = "WHERE p.time_id = ?";
        params.push(Number(user.time_id));
      }

      const [projetos] = await pool.execute<RowDataPacket[]>(
        `SELECT p.projeto_id,
                p.nome,
                p.tipo_sistema,
                p.prioridade,
                p.descricao,
                p.time_id,
                t.nome_time,
                resp.nome AS responsavel_nome,
                vend.nome AS vendedor_nome,
                DATE_FORMAT(p.data_assinatura_contrato, '%Y-%m-%d') AS data_assinatura_contrato,
                DATE_FORMAT(p.data_vencimento_contrato, '%Y-%m-%d') AS data_vencimento_contrato
           FROM projetos p
           LEFT JOIN time t ON t.id_time = p.time_id
           LEFT JOIN usuarios resp ON resp.id_usuario = p.responsavel_id
           LEFT JOIN usuarios vend ON vend.id_usuario = p.vendedor_id
           ${filtro}
          ORDER BY p.data_criacao DESC, p.projeto_id DESC`,
        params,
      );

      if (!projetos.length) return res.json({ projetos: [] });

      const projetoIds = projetos.map((p) => p.projeto_id as number);
      const timeIds = [
        ...new Set(projetos.map((p) => p.time_id as number | null).filter((id): id is number => id !== null)),
      ];

      const [equipamentos] = await pool.query<RowDataPacket[]>(
        `SELECT i.projeto_id, e.nome_equipamento, i.quantidade
           FROM item_equipamento_projeto i
           JOIN equipamentos e ON e.equipamento_id = i.equipamento_id
          WHERE i.projeto_id IN (?)
          ORDER BY e.nome_equipamento`,
        [projetoIds],
      );

      const [anexos] = await pool.query<RowDataPacket[]>(
        `SELECT anexo_id, projeto_id, nome_anexo, anexo_tipo, anexo_tamanho
           FROM anexo
          WHERE projeto_id IN (?)
          ORDER BY anexo_id`,
        [projetoIds],
      );

      const membros = timeIds.length
        ? (
            await pool.query<RowDataPacket[]>(
              `SELECT time_id, nome
                 FROM usuarios
                WHERE time_id IN (?) AND ativo = TRUE
                ORDER BY nome`,
              [timeIds],
            )
          )[0]
        : [];

      return res.json({
        projetos: projetos.map((p) => ({
          id: String(p.projeto_id),
          nome: p.nome,
          tipo_sistema: p.tipo_sistema,
          prioridade: p.prioridade,
          descricao: p.descricao ?? "",
          data_assinatura_contrato: p.data_assinatura_contrato,
          data_vencimento_contrato: p.data_vencimento_contrato,
          responsavel: p.responsavel_nome ?? null,
          vendedor: p.vendedor_nome ?? null,
          time: p.time_id === null ? null : { id: String(p.time_id), nome: p.nome_time },
          membros_time: membros.filter((m) => m.time_id === p.time_id).map((m) => m.nome as string),
          equipamentos: equipamentos
            .filter((e) => e.projeto_id === p.projeto_id)
            .map((e) => ({ nome: e.nome_equipamento as string, quantidade: Number(e.quantidade) })),
          anexos: anexos
            .filter((a) => a.projeto_id === p.projeto_id)
            .map((a) => ({
              id: String(a.anexo_id),
              nome: a.nome_anexo as string,
              tipo: a.anexo_tipo as string,
              tamanho: Number(a.anexo_tamanho ?? 0),
            })),
        })),
      });
    } catch (error) {
      console.error("Erro ao listar projetos:", error);
      return res.status(500).json({ message: "Não foi possível carregar os projetos." });
    }
  });

  // ---------------------------------------------------
  // Download de anexo (mesma regra de acesso da listagem)
  // ---------------------------------------------------
  router.get("/:projetoId/anexos/:anexoId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo, p.time_id
           FROM anexo a
           JOIN projetos p ON p.projeto_id = a.projeto_id
          WHERE a.anexo_id = ? AND a.projeto_id = ?
          LIMIT 1`,
        [req.params.anexoId, req.params.projetoId],
      );

      const anexo = rows[0];
      if (!anexo || !podeVerProjeto(user, anexo.time_id as number | null)) {
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
  // Criação (aba "Novo projeto") - somente comercial
  // ---------------------------------------------------
  router.post("/", requireRole("comercial"), async (req, res) => {
    const {
      nome,
      data_assinatura_contrato,
      data_vencimento_contrato,
      tipo_sistema,
      id_time_responsavel,
      vendedor_nome,
      prioridade,
      descricao,
      equipamentos = [],
      anexos = [],
    } = req.body as {
      nome?: string;
      data_assinatura_contrato?: string;
      data_vencimento_contrato?: string;
      tipo_sistema?: string;
      id_time_responsavel?: string | number;
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
    if (!tipo_sistema?.trim() || tipo_sistema.trim().length > 100) {
      return res.status(400).json({ message: "Informe o tipo de sistema." });
    }
    if (!id_time_responsavel || !vendedor_nome?.trim()) {
      return res.status(400).json({ message: "Time responsável e vendedor são obrigatórios." });
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
      const [times] = await pool.execute<RowDataPacket[]>(
        "SELECT id_time, responsavel_id FROM time WHERE id_time = ? LIMIT 1",
        [String(id_time_responsavel)],
      );
      const time = times[0];
      if (!time) return res.status(400).json({ message: "Time responsável inválido." });

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
            (nome, data_assinatura_contrato, data_vencimento_contrato, responsavel_id, vendedor_id,
             tipo_sistema, time_id, prioridade, descricao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nome.trim(),
            data_assinatura_contrato,
            data_vencimento_contrato,
            vendedores[0].id_usuario,
            vendedores[0].id_usuario,
            tipo_sistema.trim(),
            time.id_time,
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

  return router;
}