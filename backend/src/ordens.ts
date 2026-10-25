import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import { validarTransicaoOS } from "./os_fluxo.js";
import { PERFIS_DE_TIME, SELECT_OS, filtroVisibilidadeOS, mapOS, podeVerOS } from "./os_comum.js";
import {
  buildOSCreatedNotificationMessage,
  buildOSCreatedNotificationTitle,
  buildOSStatusEventMessage,
  buildOSStatusNotificationTitle,
  buildStatusNotificationMessage,
  createNotificationsForTime,
  shouldCreateStatusNotification,
} from "./notificacoes.js";

const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
];

const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
const STATUS_OS = ["aberta", "em andamento", "concluida", "teste", "bloqueado", "review"] as const;
type Prioridade = (typeof PRIORIDADES)[number];
type StatusOS = (typeof STATUS_OS)[number];

type RequireRole = (...roles: Role[]) => RequestHandler;

function isResponsavelDoTime(
  user: User,
  os: { time_responsavel_id?: number | string | null },
): boolean {
  return os.time_responsavel_id != null && String(os.time_responsavel_id) === String(user.id);
}

function podeAcessarOSNoFluxo(
  user: User,
  os: {
    id_time_responsavel: number | null;
    projeto_id: number | null;
    manutencao_id: number | null;
    os_status?: string;
    time_responsavel_id?: number | string | null;
  },
): boolean {
  return (
    podeVerOS(user, os) ||
    ((os.os_status === "review" || os.os_status === "bloqueado") && isResponsavelDoTime(user, os))
  );
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

// Verifica se o usuário pode abrir O.S. dentro do projeto/manutenção informado.
//  projeto:    gestor e comercial (todos) | produção/software/implantação (só se o
//              projeto tiver O.S. do seu time)
//  manutenção: gestor e suporte (todas)   | produção/software/implantação (idem)
async function podeCriarNaOrigem(
  user: User,
  tipo: "projeto" | "manutencao",
  id: string,
): Promise<boolean> {
  const tabela = tipo === "projeto" ? "projetos" : "manutencoes";
  const coluna = tipo === "projeto" ? "projeto_id" : "manutencao_id";
  const donos: Role[] = tipo === "projeto" ? ["gestor", "comercial"] : ["gestor", "suporte"];

  if (donos.includes(user.role)) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ${coluna} FROM ${tabela} WHERE ${coluna} = ? LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  }

  if (!PERFIS_DE_TIME.includes(user.role) || user.time_id === null) return false;

  const [rows] = await pool.execute<RowDataPacket[]>(
    tipo === "projeto"
      ? `SELECT 1
           FROM projetos p
          WHERE p.projeto_id = ?
            AND EXISTS (
              SELECT 1 FROM os o
               WHERE o.projeto_id = p.projeto_id AND o.id_time_responsavel = ?
            )
          LIMIT 1`
      : `SELECT 1
           FROM manutencoes m
          WHERE m.manutencao_id = ?
            AND EXISTS (
              SELECT 1 FROM os o
               WHERE o.manutencao_id = m.manutencao_id AND o.id_time_responsavel = ?
            )
          LIMIT 1`,
    [id, Number(user.time_id)],
  );
  return rows.length > 0;
}

export function createOrdensRouter(requireRole: RequireRole): Router {
  const router = Router();

  // ---------------------------------------------------
  // Listagem (aba "Ordens disponíveis")
  // gestor: todas | comercial: as de projetos | suporte: as de manutenções
  // demais: apenas as direcionadas ao seu time
  // ---------------------------------------------------
  router.get("/", requireRole(...PERFIS_COM_ACESSO), async (_req, res) => {
    const user = res.locals.user as User;

    try {
      const filtro = filtroVisibilidadeOS(user);
      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS}
          WHERE (${filtro.sql})
             OR (o.os_status IN ('review', 'bloqueado') AND t.responsavel_id = ?)
          ORDER BY o.data_criacao DESC, o.os_id DESC`,
        [...filtro.params, Number(user.id)],
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
    const osId = String(req.params.osId);

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS} WHERE o.os_id = ? LIMIT 1`,
        [osId],
      );

      const os = rows[0];
      if (
        !os ||
        !podeAcessarOSNoFluxo(user, {
          id_time_responsavel: os.id_time_responsavel as number | null,
          projeto_id: os.projeto_id as number | null,
          manutencao_id: os.manutencao_id as number | null,
          os_status: os.os_status as string,
          time_responsavel_id: os.time_responsavel_id as number | null,
        })
      ) {
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

      // Pedido pai (projeto ou manutenção de onde a O.S. foi criada)
      let pedidoPai: {
        tipo: "projeto" | "manutencao";
        id: string;
        titulo: string;
        data_limite: string | null;
      } | null = null;

      if (os.projeto_id !== null) {
        const [pais] = await pool.execute<RowDataPacket[]>(
          `SELECT projeto_id, nome, DATE_FORMAT(data_limite, '%Y-%m-%d') AS data_limite
             FROM projetos WHERE projeto_id = ? LIMIT 1`,
          [os.projeto_id],
        );
        if (pais[0]) {
          pedidoPai = {
            tipo: "projeto",
            id: String(pais[0].projeto_id),
            titulo: pais[0].nome as string,
            data_limite: (pais[0].data_limite as string | null) ?? null,
          };
        }
      } else if (os.manutencao_id !== null) {
        const [pais] = await pool.execute<RowDataPacket[]>(
          `SELECT manutencao_id, resumo, DATE_FORMAT(data_limite, '%Y-%m-%d') AS data_limite
             FROM manutencoes WHERE manutencao_id = ? LIMIT 1`,
          [os.manutencao_id],
        );
        if (pais[0]) {
          pedidoPai = {
            tipo: "manutencao",
            id: String(pais[0].manutencao_id),
            titulo: ((pais[0].resumo as string | null) ?? "") || `Manutenção #${pais[0].manutencao_id}`,
            data_limite: (pais[0].data_limite as string | null) ?? null,
          };
        }
      }

      return res.json({
        ordem: {
          ...mapOS(os),
          pedido_pai: pedidoPai,
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
        `SELECT a.nome_anexo, a.anexo_tipo, a.conteudo_arquivo,
                o.id_time_responsavel, o.projeto_id, o.manutencao_id, o.os_status,
                t.responsavel_id AS time_responsavel_id
           FROM anexo a
           JOIN os o ON o.os_id = a.os_id
           LEFT JOIN time t ON t.id_time = o.id_time_responsavel
          WHERE a.anexo_id = ? AND a.os_id = ?
          LIMIT 1`,
        [String(req.params.anexoId), String(req.params.osId)],
      );

      const anexo = rows[0];
      if (
        !anexo ||
        !podeAcessarOSNoFluxo(user, {
          id_time_responsavel: anexo.id_time_responsavel as number | null,
          projeto_id: anexo.projeto_id as number | null,
          manutencao_id: anexo.manutencao_id as number | null,
          os_status: anexo.os_status as string,
          time_responsavel_id: anexo.time_responsavel_id as number | null,
        })
      ) {
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
  // Criação - somente a partir de um projeto OU de uma manutenção existente
  // (botão "Nova O.S." na tela expandida do projeto/manutenção)
  // ---------------------------------------------------
  router.post("/", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;

    const {
      os_titulo,
      os_descricao,
      prioridade,
      data_limite,
      id_time_responsavel,
      projeto_id,
      manutencao_id,
      equipamentos = [],
      anexos = [],
    } = (req.body ?? {}) as {
      os_titulo?: string;
      os_descricao?: string;
      prioridade?: string;
      data_limite?: string;
      id_time_responsavel?: string | number;
      projeto_id?: string | number | null;
      manutencao_id?: string | number | null;
      equipamentos?: { nome_equipamento?: string; quantidade?: number }[];
      anexos?: {
        nome_anexo?: string;
        anexo_tipo?: string;
        anexo_tamanho?: number;
        conteudo_arquivo_base64?: string;
      }[];
    };

    if (!projeto_id === !manutencao_id) {
      return res
        .status(400)
        .json({ message: "A O.S. deve ser criada a partir de um projeto ou de uma manutenção." });
    }
    const origemTipo = projeto_id ? "projeto" : "manutencao";
    const origemId = String(origemTipo === "projeto" ? projeto_id : manutencao_id);
    if (!/^\d+$/.test(origemId)) {
      return res.status(400).json({ message: "Projeto ou manutenção inválido." });
    }

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
      if (!(await podeCriarNaOrigem(user, origemTipo, origemId))) {
        return res.status(404).json({ message: "Projeto ou manutenção não encontrado." });
      }

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
            (os_titulo, os_descricao, os_status, prioridade, data_limite, id_criador,
             id_time_responsavel, projeto_id, manutencao_id)
           VALUES (?, ?, 'aberta', ?, ?, ?, ?, ?, ?)`,
          [
            os_titulo.trim(),
            os_descricao.trim(),
            prioridade.toLowerCase(),
            data_limite,
            user.id,
            time.id_time,
            origemTipo === "projeto" ? origemId : null,
            origemTipo === "manutencao" ? origemId : null,
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

        const [criadorRow] = await connection.execute<RowDataPacket[]>(
          "SELECT nome FROM usuarios WHERE id_usuario = ? LIMIT 1",
          [user.id],
        );
        const criadorNome = (criadorRow[0]?.nome as string | undefined) ?? "Usuário";
        const [timeRow] = await connection.execute<RowDataPacket[]>(
          "SELECT nome_time FROM time WHERE id_time = ? LIMIT 1",
          [time.id_time],
        );
        const nomeTime = (timeRow[0]?.nome_time as string | undefined) ?? "time responsável";

        await createNotificationsForTime(connection, {
          titulo: buildOSCreatedNotificationTitle(),
          mensagem: buildOSCreatedNotificationMessage(os_titulo.trim(), criadorNome, nomeTime),
          timeId: Number(time.id_time),
          osId,
          usuarioOrigemId: user.id,
        });

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

  router.put("/:osId/status", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);
    const statusInput = req.body?.os_status ?? req.body?.status;
    const statusNovo = typeof statusInput === "string" ? statusInput.trim().toLowerCase() : statusInput;

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }

    if (typeof statusNovo !== "string" || !STATUS_OS.includes(statusNovo as StatusOS)) {
      return res.status(400).json({ message: "Status inválido." });
    }
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.os_id, o.os_titulo, o.os_status, o.id_time_responsavel,
          o.projeto_id, o.manutencao_id, t.nome_time,
          t.responsavel_id AS time_responsavel_id
           FROM os o
           LEFT JOIN time t ON t.id_time = o.id_time_responsavel
          WHERE o.os_id = ?
          LIMIT 1`,
        [osId],
      );

      const os = rows[0];
      if (!os) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      if (!podeAcessarOSNoFluxo(user, {
        id_time_responsavel: os.id_time_responsavel as number | null,
        projeto_id: os.projeto_id as number | null,
        manutencao_id: os.manutencao_id as number | null,
        os_status: os.os_status as string,
        time_responsavel_id: os.time_responsavel_id as number | null,
      })) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      const responsavelDoTime = isResponsavelDoTime(user, {
        time_responsavel_id: os.time_responsavel_id as number | null,
      });
      const statusAtual = os.os_status as StatusOS;
      if (statusNovo === "review" && os.time_responsavel_id == null) {
        return res.status(409).json({
          message: "Cadastre o responsável do time antes de enviar esta O.S. para Review.",
        });
      }
      const erroTransicao = validarTransicaoOS(statusAtual, statusNovo as StatusOS, responsavelDoTime);
      if (erroTransicao) {
        return res.status(erroTransicao.status).json({ message: erroTransicao.message });
      }

      if (!shouldCreateStatusNotification(os.os_status as string | null, statusNovo)) {
        return res.json({
          message: "O status já está atualizado.",
          os: mapOS({ ...os, os_status: statusNovo }),
        });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [updateResult] = await connection.execute<ResultSetHeader>(
          "UPDATE os SET os_status = ? WHERE os_id = ? AND os_status = ?",
          [statusNovo, osId, os.os_status],
        );
        if (!updateResult.affectedRows) {
          const [currentRows] = await connection.execute<RowDataPacket[]>(
            "SELECT os_status FROM os WHERE os_id = ? LIMIT 1",
            [osId],
          );
          await connection.rollback();
          return res.json({
            message: "O status já foi atualizado.",
            os: mapOS({ ...os, os_status: currentRows[0]?.os_status ?? os.os_status }),
          });
        }

        const statusEvento = statusNovo === "concluida" || statusNovo === "bloqueado";
        let mensagem = buildStatusNotificationMessage(os.os_status as string | null, statusNovo);
        if (statusEvento) {
          const [eventRows] = await connection.execute<RowDataPacket[]>(
            "SELECT DATE_FORMAT(CURRENT_TIMESTAMP, '%d/%m/%Y %H:%i:%s') AS data_evento",
          );
          mensagem = buildOSStatusEventMessage(
            os.os_id as number,
            os.os_titulo as string,
            statusNovo,
            (os.nome_time as string | undefined) ?? "time responsável",
            user.name,
            (eventRows[0]?.data_evento as string | undefined) ?? "data não informada",
          );
        }

        await createNotificationsForTime(connection, {
          titulo:
            statusNovo === "review"
              ? "O.S. aguardando revisão"
              : statusNovo === "teste" && statusAtual === "bloqueado"
                ? "O.S. liberada para Teste"
                : statusEvento
                  ? buildOSStatusNotificationTitle(statusNovo as "concluida" | "bloqueado")
                  : "Atualização de status",
          mensagem,
          timeId: Number(os.id_time_responsavel),
          osId: os.os_id,
          usuarioOrigemId: user.id,
          incluirUsuarioOrigemComoDestino: statusNovo === "concluida",
          incluirResponsavelDoTimeComoDestino: statusNovo === "review",
        });

        await connection.commit();
        return res.json({
          message: "Status atualizado com sucesso.",
          os: mapOS({ ...os, os_status: statusNovo }),
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao atualizar status da O.S.:", error);
      return res.status(500).json({ message: "Não foi possível atualizar o status da ordem de serviço." });
    }
  });

  return router;
}
