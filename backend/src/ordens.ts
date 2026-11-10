import { Router } from "express";
import type { RequestHandler } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import {
  isCriticalPriority,
  isTimeMonitoramento,
  isTimeSoftware,
  validarTransicaoOS,
} from "./os_fluxo.js";
import { PERFIS_DE_TIME, SELECT_OS, filtroVisibilidadeOS, mapOS, podeVerOS } from "./os_comum.js";
import {
  buildOSAguardandoVerificacaoMessage,
  buildOSCreatedNotificationMessage,
  buildOSCreatedNotificationTitle,
  buildOSStatusEventMessage,
  buildOSStatusNotificationTitle,
  buildOSVerificacaoMessage,
  buildStatusNotificationMessage,
  createCriticalOSNotificationsForDepartments,
  createOSChangeNotifications,
  createNotificationsForTime,
  shouldCreateStatusNotification,
  type OSChangeType,
} from "./notificacoes.js";

const PERFIS_COM_ACESSO: Role[] = [
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
  "monitoramento",
];

const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;
const STATUS_OS = ["aberta", "em andamento", "concluida", "teste", "bloqueado", "review", "verificacao"] as const;
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
    ((os.os_status === "review" || os.os_status === "bloqueado" || os.os_status === "verificacao") &&
      isResponsavelDoTime(user, os)) ||
    // O monitoramento enxerga a O.S. de outro time apenas enquanto ela aguarda a sua verificação.
    (os.os_status === "verificacao" && user.role === "monitoramento")
  );
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

export async function ensureOSVerificationSchema(): Promise<void> {
  const [statusColumns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM os LIKE 'os_status'");
  const statusType = String(statusColumns[0]?.Type ?? "").toLowerCase();
  if (!statusType.includes("'verificacao'")) {
    await pool.query(
      `ALTER TABLE os
       MODIFY COLUMN os_status ENUM(
         'aberta', 'em andamento', 'concluida', 'teste', 'bloqueado', 'review', 'verificacao'
       ) NOT NULL DEFAULT 'aberta'`,
    );
  }

  const [verificationTables] = await pool.query<RowDataPacket[]>(`SHOW TABLES LIKE 'os_verificacoes'`);
  if (!verificationTables.length) {
    await pool.query(`
      CREATE TABLE os_verificacoes (
        verificacao_id INT PRIMARY KEY AUTO_INCREMENT,
        os_id INT NOT NULL,
        resultado ENUM('aprovada', 'reprovada') NOT NULL,
        justificativa TEXT NULL,
        usuario_id INT NULL,
        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_os_verificacoes_os (os_id, data_criacao),
        CONSTRAINT fk_verificacao_os
          FOREIGN KEY (os_id) REFERENCES os(os_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_verificacao_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB`);
  }
}

// Verifica se o usuário pode abrir O.S. dentro do projeto/manutenção informado.
//  projeto:    gestor e comercial (todos) | produção/software/implantação/monitoramento (só se o
//              projeto tiver O.S. do seu time)
//  manutenção: gestor e suporte (todas)   | produção/software/implantação/monitoramento (idem)
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
      const emVerificacao = user.role === "monitoramento" ? "OR o.os_status = 'verificacao'" : "";
      const [rows] = await pool.execute<RowDataPacket[]>(
        `${SELECT_OS}
          WHERE (${filtro.sql})
             OR (o.os_status IN ('review', 'bloqueado', 'verificacao') AND t.responsavel_id = ?)
             ${emVerificacao}
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
        // Depois da decisão, a O.S. sai da visão do monitoramento. O 410 permite à tela
        // redirecionar com um aviso, em vez de mostrar erro (ex.: notificação antiga).
        if (os && user.role === "monitoramento") {
          const [decisoes] = await pool.execute<RowDataPacket[]>(
            "SELECT 1 FROM os_verificacoes WHERE os_id = ? LIMIT 1",
            [osId],
          );
          if (decisoes.length) {
            return res.status(410).json({ message: "Esta O.S. já foi verificada." });
          }
        }
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }

      const [verificacoes] = await pool.execute<RowDataPacket[]>(
        `SELECT v.resultado, v.justificativa, u.nome AS usuario_nome,
                DATE_FORMAT(v.data_criacao, '%d/%m/%Y %H:%i') AS data_verificacao
           FROM os_verificacoes v
           LEFT JOIN usuarios u ON u.id_usuario = v.usuario_id
          WHERE v.os_id = ?
          ORDER BY v.data_criacao DESC, v.verificacao_id DESC
          LIMIT 1`,
        [os.os_id],
      );
      const ultimaVerificacao = verificacoes[0];

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
          ultima_reprovacao:
            ultimaVerificacao?.resultado === "reprovada"
              ? {
                  justificativa: (ultimaVerificacao.justificativa as string | null) ?? "",
                  usuario: (ultimaVerificacao.usuario_nome as string | null) ?? null,
                  data: ultimaVerificacao.data_verificacao as string,
                }
              : null,
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
        "SELECT id_time, departamento FROM time WHERE id_time = ? LIMIT 1",
        [String(id_time_responsavel)],
      );
      const time = times[0];
      if (!time) return res.status(400).json({ message: "Time responsável inválido." });
      if (isTimeMonitoramento(time.departamento as string | null)) {
        return res.status(400).json({ message: "Uma O.S. não pode ser atribuída ao time de monitoramento." });
      }

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

        if (isCriticalPriority(prioridade)) {
          await createCriticalOSNotificationsForDepartments(connection, {
            evento: "aberta",
            osId,
            osTitulo: os_titulo.trim(),
            timeIdResponsavel: time.id_time,
            timeNome: nomeTime,
            usuarioOrigemId: user.id,
          });
        } else {
          await createNotificationsForTime(connection, {
            titulo: buildOSCreatedNotificationTitle(),
            mensagem: buildOSCreatedNotificationMessage(os_titulo.trim(), criadorNome, nomeTime),
            timeId: Number(time.id_time),
            osId,
            usuarioOrigemId: user.id,
          });
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

  // ---------------------------------------------------
  // Edição dos dados de uma O.S. existente
  // ---------------------------------------------------
  router.put("/:osId", requireRole(...PERFIS_COM_ACESSO), async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);
    const {
      os_titulo,
      os_descricao,
      prioridade,
      data_limite,
      id_time_responsavel,
      equipamentos,
    } = (req.body ?? {}) as {
      os_titulo?: string;
      os_descricao?: string;
      prioridade?: string;
      data_limite?: string;
      id_time_responsavel?: string | number;
      equipamentos?: { nome_equipamento?: string; quantidade?: number }[];
    };

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }
    if (!os_titulo?.trim() || os_titulo.trim().length > 150) {
      return res.status(400).json({ message: "Informe um título válido (até 150 caracteres)." });
    }
    if (!os_descricao?.trim() || os_descricao.trim().length > 5000) {
      return res.status(400).json({ message: "Informe a descrição (até 5000 caracteres)." });
    }
    if (!prioridade || !PRIORIDADES.includes(prioridade.toLowerCase() as Prioridade)) {
      return res.status(400).json({ message: "Prioridade inválida." });
    }
    if (!data_limite || !dataValida(data_limite)) {
      return res.status(400).json({ message: "Informe um prazo válido." });
    }
    if (id_time_responsavel == null || !/^\d+$/.test(String(id_time_responsavel))) {
      return res.status(400).json({ message: "Selecione um time responsável válido." });
    }
    if (equipamentos !== undefined && !Array.isArray(equipamentos)) {
      return res.status(400).json({ message: "Equipamentos em formato inválido." });
    }

    const itens = new Map<string, { nome: string; quantidade: number }>();
    for (const equipamento of equipamentos ?? []) {
      const nome = equipamento?.nome_equipamento?.trim();
      const quantidade = Number(equipamento?.quantidade);
      if (!nome || nome.length > 150 || !Number.isInteger(quantidade) || quantidade < 1) {
        return res.status(400).json({ message: "Informe equipamentos válidos e quantidades positivas." });
      }
      const key = nome.toLocaleLowerCase();
      const existente = itens.get(key);
      if (existente) existente.quantidade += quantidade;
      else itens.set(key, { nome, quantidade });
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

      if (os.os_status === "verificacao") {
        return res.status(409).json({ message: "A O.S. não pode ser editada durante a verificação." });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [times] = await connection.execute<RowDataPacket[]>(
          "SELECT id_time, nome_time, departamento FROM time WHERE id_time = ? LIMIT 1",
          [String(id_time_responsavel)],
        );
        if (!times[0]) {
          await connection.rollback();
          return res.status(400).json({ message: "Time responsável inválido." });
        }
        if (isTimeMonitoramento(times[0].departamento as string | null)) {
          await connection.rollback();
          return res.status(400).json({ message: "Uma O.S. não pode ser atribuída ao time de monitoramento." });
        }

        const [updateResult] = await connection.execute<ResultSetHeader>(
          `UPDATE os
              SET os_titulo = ?, os_descricao = ?, prioridade = ?, data_limite = ?, id_time_responsavel = ?
            WHERE os_id = ?`,
          [
            os_titulo.trim(),
            os_descricao.trim(),
            prioridade.toLowerCase(),
            data_limite,
            String(id_time_responsavel),
            osId,
          ],
        );

        if (equipamentos !== undefined) {
          await connection.execute("DELETE FROM item_equipamento_os WHERE os_id = ?", [osId]);
          for (const item of itens.values()) {
            await connection.execute(
              "INSERT IGNORE INTO equipamentos (nome_equipamento) VALUES (?)",
              [item.nome],
            );
            const [equipamentosRows] = await connection.execute<RowDataPacket[]>(
              "SELECT equipamento_id FROM equipamentos WHERE LOWER(nome_equipamento) = LOWER(?) LIMIT 1",
              [item.nome],
            );
            const equipamentoId = equipamentosRows[0]?.equipamento_id;
            if (!equipamentoId) throw new Error("Não foi possível registrar um equipamento.");
            await connection.execute(
              "INSERT INTO item_equipamento_os (os_id, equipamento_id, quantidade) VALUES (?, ?, ?)",
              [osId, equipamentoId, item.quantidade],
            );
          }
        }

        // Ao mudar de time, a O.S. sai do time atual e o novo time é avisado.
        const changes: OSChangeType[] = [];
        if (String(os.data_limite ?? "") !== data_limite) changes.push("prazo");
        if (String(os.prioridade ?? "").trim().toLowerCase() !== prioridade.trim().toLowerCase()) changes.push("prioridade");
        if (String(os.os_descricao ?? "").trim() !== os_descricao.trim()) changes.push("descricao");

        const encaminhada = String(os.id_time_responsavel ?? "") !== String(id_time_responsavel);
        if (encaminhada) changes.push("time");
        if (changes.length && updateResult.affectedRows > 0) {
          await createOSChangeNotifications(connection, {
            timeId: String(id_time_responsavel),
            osId,
            osTitulo: os_titulo.trim(),
            usuarioOrigemId: user.id,
            usuarioNome: user.name,
            changes,
            incluirResponsavelDoTimeComoDestino: true,
          });
        }

        await connection.commit();
        return res.json({ message: "Ordem de serviço atualizada com sucesso.", encaminhada });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao editar O.S.:", error);
      return res.status(500).json({ message: "Não foi possível atualizar a ordem de serviço." });
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
          o.projeto_id, o.manutencao_id, t.nome_time, t.departamento,
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
      const erroTransicao = validarTransicaoOS(
        statusAtual,
        statusNovo as StatusOS,
        responsavelDoTime,
        isTimeSoftware(os.departamento as string | null),
      );
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

        // Ao entrar em verificação, a equipe de monitoramento também é avisada.
        let usuariosMonitoramento: number[] = [];
        if (statusNovo === "verificacao") {
          mensagem = buildOSAguardandoVerificacaoMessage(
            os.os_id as number,
            os.os_titulo as string,
            (os.nome_time as string | undefined) ?? "time responsável",
            user.name,
          );
          const [monitoramento] = await connection.execute<RowDataPacket[]>(
            "SELECT id_usuario FROM usuarios WHERE cargo = 'monitoramento' AND ativo = TRUE",
          );
          usuariosMonitoramento = monitoramento.map((row) => Number(row.id_usuario));
        }

        await createOSChangeNotifications(connection, {
          usuariosDestinoExtras: usuariosMonitoramento,
          titulo:
            statusNovo === "verificacao"
              ? "O.S. aguardando verificação"
              : statusNovo === "review"
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
          usuarioNome: user.name,
          osTitulo: os.os_titulo as string,
          changes: ["status"],
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

  // ---------------------------------------------------
  // Verificação pelo monitoramento
  // aprovada: conclui a O.S. | reprovada: bloqueia e devolve ao time de software.
  // A O.S. nunca muda de time: o time responsável continua sendo o que a executou.
  // ---------------------------------------------------
  router.post("/:osId/verificacao", requireRole("monitoramento"), async (req, res) => {
    const user = res.locals.user as User;
    const osId = String(req.params.osId);
    const { resultado, justificativa } = (req.body ?? {}) as {
      resultado?: unknown;
      justificativa?: unknown;
    };

    if (!/^\d+$/.test(osId)) {
      return res.status(404).json({ message: "Ordem de serviço não encontrada." });
    }
    if (resultado !== "aprovada" && resultado !== "reprovada") {
      return res.status(400).json({ message: "Informe se a verificação foi aprovada ou reprovada." });
    }

    const motivo = typeof justificativa === "string" ? justificativa.trim() : "";
    if (resultado === "reprovada" && !motivo) {
      return res.status(400).json({ message: "O motivo do bloqueio é obrigatório" });
    }
    if (motivo.length > 5000) {
      return res.status(400).json({ message: "O motivo pode ter até 5000 caracteres." });
    }

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT o.os_id, o.os_titulo, o.os_status, o.id_time_responsavel,
                m.responsavel_id AS manutencao_responsavel_id,
                COALESCE(p.vendedor_id, p.responsavel_id) AS projeto_responsavel_id
           FROM os o
           LEFT JOIN manutencoes m ON m.manutencao_id = o.manutencao_id
           LEFT JOIN projetos p ON p.projeto_id = o.projeto_id
          WHERE o.os_id = ?
          LIMIT 1`,
        [osId],
      );

      const os = rows[0];
      if (!os) {
        return res.status(404).json({ message: "Ordem de serviço não encontrada." });
      }
      if (os.os_status !== "verificacao") {
        return res.status(409).json({ message: "Esta O.S. já foi verificada." });
      }

      const statusNovo = resultado === "aprovada" ? "concluida" : "bloqueado";

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // A condição de status evita duas decisões simultâneas sobre a mesma O.S.
        const [updateResult] = await connection.execute<ResultSetHeader>(
          "UPDATE os SET os_status = ? WHERE os_id = ? AND os_status = 'verificacao'",
          [statusNovo, osId],
        );
        if (!updateResult.affectedRows) {
          await connection.rollback();
          return res.status(409).json({ message: "Esta O.S. já foi verificada." });
        }

        await connection.execute(
          `INSERT INTO os_verificacoes (os_id, resultado, justificativa, usuario_id)
           VALUES (?, ?, ?, ?)`,
          [osId, resultado, resultado === "reprovada" ? motivo : null, user.id],
        );

        const [eventRows] = await connection.execute<RowDataPacket[]>(
          "SELECT DATE_FORMAT(CURRENT_TIMESTAMP, '%d/%m/%Y %H:%i:%s') AS data_evento",
        );

        await createOSChangeNotifications(connection, {
          titulo: buildOSStatusNotificationTitle(statusNovo),
          mensagem: buildOSVerificacaoMessage(
            os.os_id as number,
            os.os_titulo as string,
            resultado,
            user.name,
            (eventRows[0]?.data_evento as string | undefined) ?? "data não informada",
            motivo,
          ),
          timeId: os.id_time_responsavel as number | null,
          osId: os.os_id as number,
          usuarioOrigemId: user.id,
          usuarioNome: user.name,
          osTitulo: os.os_titulo as string,
          changes: ["status"],
          incluirResponsavelDoTimeComoDestino: true,
          usuariosDestinoExtras: [
            os.manutencao_responsavel_id as number | null,
            os.projeto_responsavel_id as number | null,
          ],
        });

        await connection.commit();
        return res.json({
          message:
            resultado === "aprovada"
              ? "Verificação aprovada. A O.S. foi concluída."
              : "Verificação reprovada. A O.S. voltou para a equipe de software.",
          os: { id: String(os.os_id), status: statusNovo },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Erro ao registrar verificação da O.S.:", error);
      return res.status(500).json({ message: "Não foi possível registrar a verificação da ordem de serviço." });
    }
  });

  return router;
}
