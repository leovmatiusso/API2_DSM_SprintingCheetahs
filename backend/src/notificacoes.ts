import { Router, type Request, type RequestHandler, type Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { User } from "./users.js";

export async function ensureNotificationSchema(): Promise<void> {
  const [tables] = await pool.query<RowDataPacket[]>(`SHOW TABLES LIKE 'notificacoes'`);
  if (!tables.length) {
    await pool.query(`
      CREATE TABLE notificacoes (
        notificacao_id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(200) NOT NULL,
        mensagem TEXT NOT NULL,
        time_id INT NULL,
        os_id INT NULL,
        projeto_id INT NULL,
        manutencao_id INT NULL,
        usuario_origem_id INT NULL,
        usuario_destino_id INT NOT NULL,
        data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notificacoes_destino (usuario_destino_id, data_criacao DESC),
        INDEX idx_notificacoes_time (time_id),
        INDEX idx_notificacoes_os (os_id),
        INDEX idx_notificacoes_projeto (projeto_id),
        INDEX idx_notificacoes_manutencao (manutencao_id),
        INDEX idx_notificacoes_projeto_destino (projeto_id, usuario_destino_id),
        CONSTRAINT fk_notificacoes_time
          FOREIGN KEY (time_id) REFERENCES time(id_time)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacoes_os
          FOREIGN KEY (os_id) REFERENCES os(os_id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacoes_projeto
          FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacoes_manutencao
          FOREIGN KEY (manutencao_id) REFERENCES manutencoes(manutencao_id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacoes_origem
          FOREIGN KEY (usuario_origem_id) REFERENCES usuarios(id_usuario)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacoes_destino
          FOREIGN KEY (usuario_destino_id) REFERENCES usuarios(id_usuario)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB`);
  }

  const [columns] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM notificacoes`);
  const columnNames = new Set(columns.map((column) => column.Field));
  const messageColumn = columns.find((column) => column.Field === "mensagem");

  if (String(messageColumn?.Type ?? "").toLowerCase().startsWith("varchar")) {
    await pool.query(`ALTER TABLE notificacoes MODIFY COLUMN mensagem TEXT NOT NULL`);
  }

  if (!columnNames.has("usuario_destino_id")) {
    await pool.query(`ALTER TABLE notificacoes ADD COLUMN usuario_destino_id INT NULL AFTER usuario_origem_id`);
  }

  if (!columnNames.has("data_criacao")) {
    await pool.query(`ALTER TABLE notificacoes ADD COLUMN data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER usuario_destino_id`);
  }

  if (!columnNames.has("projeto_id")) {
    await pool.query(`ALTER TABLE notificacoes ADD COLUMN projeto_id INT NULL AFTER os_id`);
  }
  if (!columnNames.has("manutencao_id")) {
    await pool.query(`ALTER TABLE notificacoes ADD COLUMN manutencao_id INT NULL AFTER projeto_id`);
  }

  const [indexes] = await pool.query<RowDataPacket[]>(`SHOW INDEX FROM notificacoes`);
  const indexNames = new Set(indexes.map((index) => index.Key_name));
  if (!indexNames.has("idx_notificacoes_projeto")) {
    await pool.query(`ALTER TABLE notificacoes ADD INDEX idx_notificacoes_projeto (projeto_id)`);
  }
  if (!indexNames.has("idx_notificacoes_manutencao")) {
    await pool.query(`ALTER TABLE notificacoes ADD INDEX idx_notificacoes_manutencao (manutencao_id)`);
  }
  if (indexNames.has("uq_notificacoes_projeto_destino")) {
    await pool.query(`ALTER TABLE notificacoes DROP INDEX uq_notificacoes_projeto_destino`);
  }
  if (!indexNames.has("idx_notificacoes_projeto_destino")) {
    await pool.query(
      `ALTER TABLE notificacoes ADD INDEX idx_notificacoes_projeto_destino (projeto_id, usuario_destino_id)`,
    );
  }

  const [constraints] = await pool.query<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notificacoes'
        AND CONSTRAINT_NAME = 'fk_notificacoes_projeto'`,
  );
  if (!constraints.length) {
    await pool.query(
      `ALTER TABLE notificacoes
       ADD CONSTRAINT fk_notificacoes_projeto
       FOREIGN KEY (projeto_id) REFERENCES projetos(projeto_id)
       ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  const [maintenanceConstraints] = await pool.query<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notificacoes'
        AND CONSTRAINT_NAME = 'fk_notificacoes_manutencao'`,
  );
  if (!maintenanceConstraints.length) {
    await pool.query(
      `ALTER TABLE notificacoes
       ADD CONSTRAINT fk_notificacoes_manutencao
       FOREIGN KEY (manutencao_id) REFERENCES manutencoes(manutencao_id)
       ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  const [readsTables] = await pool.query<RowDataPacket[]>(`SHOW TABLES LIKE 'notificacao_leituras'`);
  if (!readsTables.length) {
    await pool.query(`
      CREATE TABLE notificacao_leituras (
        notificacao_id INT NOT NULL,
        usuario_id INT NOT NULL,
        data_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (notificacao_id, usuario_id),
        INDEX idx_notificacao_leitura_usuario (usuario_id, data_leitura),
        CONSTRAINT fk_notificacao_leitura_notificacao
          FOREIGN KEY (notificacao_id) REFERENCES notificacoes(notificacao_id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_notificacao_leitura_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB`);
  }
}

export type ConnectionLike = {
  execute: <T = RowDataPacket[]>(query: string, params?: any[]) => Promise<[T, any]>;
};

export function shouldCreateStatusNotification(
  statusAnterior: string | null | undefined,
  statusNovo: string | null | undefined,
): boolean {
  if (statusNovo === null || statusNovo === undefined || String(statusNovo).trim() === "") {
    return false;
  }

  if (statusAnterior === null || statusAnterior === undefined || String(statusAnterior).trim() === "") {
    return true;
  }

  return String(statusAnterior).trim().toLowerCase() !== String(statusNovo).trim().toLowerCase();
}

export function buildStatusNotificationMessage(
  statusAnterior: string | null | undefined,
  statusNovo: string | null | undefined,
): string {
  const anterior = statusAnterior && String(statusAnterior).trim() ? String(statusAnterior).trim() : "não informado";
  const novo = String(statusNovo ?? "").trim();

  if (!novo) {
    return `Status da ordem de serviço alterado de "${anterior}".`;
  }

  return `Status da ordem de serviço alterado de "${anterior}" para "${novo}".`;
}

export function buildOSCreatedNotificationTitle(): string {
  return "Nova ordem de serviço";
}

export function buildOSCriticalNotificationMessage(
  osId: number | string,
  osTitulo: string,
  evento: "aberta" | "prioridade elevada",
  timeNome: string,
): string {
  const os = `A O.S. #${escapeNotificationHtml(String(osId))} — <strong>${escapeNotificationHtml(osTitulo)}</strong>`;
  if (evento === "aberta") {
    return `${os} crítica foi aberta para o time <strong>${escapeNotificationHtml(timeNome)}</strong>.`;
  }
  return `A prioridade da ${os} foi elevada para crítica no time <strong>${escapeNotificationHtml(timeNome)}</strong>.`;
}

export function buildOSCriticalNotificationTitle(evento: "aberta" | "prioridade elevada"): string {
  return evento === "aberta" ? "Ordem de Serviço crítica" : "Prioridade da OS elevada para crítica";
}

export function buildOSStatusNotificationTitle(status: "concluida" | "bloqueado"): string {
  return status === "concluida" ? "Ordem de Serviço concluída" : "Ordem de Serviço bloqueada";
}

export function buildOSStatusEventMessage(
  osId: number | string,
  osTitulo: string,
  status: "concluida" | "bloqueado",
  timeNome: string,
  usuarioNome: string,
  dataEvento: string,
): string {
  const acao = status === "concluida" ? "foi concluída" : "foi bloqueada";
  return `A O.S. #${escapeNotificationHtml(String(osId))} — <strong>${escapeNotificationHtml(osTitulo)}</strong> ${acao} pelo time <strong>${escapeNotificationHtml(timeNome)}</strong>, por <strong>${escapeNotificationHtml(usuarioNome)}</strong>, em ${escapeNotificationHtml(dataEvento)}.`;
}

export function buildOSEncaminhadaMessage(
  osId: number | string,
  osTitulo: string,
  timeAnterior: string,
  timeNovo: string,
  usuarioNome: string,
): string {
  return `A O.S. #${escapeNotificationHtml(String(osId))} — <strong>${escapeNotificationHtml(osTitulo)}</strong> foi encaminhada do time <strong>${escapeNotificationHtml(timeAnterior)}</strong> para o time <strong>${escapeNotificationHtml(timeNovo)}</strong> por <strong>${escapeNotificationHtml(usuarioNome)}</strong>.`;
}

export function buildOSAguardandoVerificacaoMessage(
  osId: number | string,
  osTitulo: string,
  timeNome: string,
  usuarioNome: string,
): string {
  return `A O.S. #${escapeNotificationHtml(String(osId))} — <strong>${escapeNotificationHtml(osTitulo)}</strong> do time <strong>${escapeNotificationHtml(timeNome)}</strong> foi enviada para verificação por <strong>${escapeNotificationHtml(usuarioNome)}</strong>.`;
}

// O motivo fica dentro de <strong> e em uma só linha porque o NotificationMessage só
// decodifica (e reconhece) o conteúdo escapado nesse trecho.
export function buildOSVerificacaoMessage(
  osId: number | string,
  osTitulo: string,
  resultado: "aprovada" | "reprovada",
  usuarioNome: string,
  dataEvento: string,
  justificativa?: string | null,
): string {
  const os = `A O.S. #${escapeNotificationHtml(String(osId))} — <strong>${escapeNotificationHtml(osTitulo)}</strong>`;
  const autor = `<strong>${escapeNotificationHtml(usuarioNome)}</strong> (Monitoramento), em ${escapeNotificationHtml(dataEvento)}`;

  if (resultado === "aprovada") {
    return `${os} foi aprovada na verificação e concluída por ${autor}.`;
  }

  const motivo = escapeNotificationHtml((justificativa ?? "").replace(/\s+/g, " ").trim());
  return `${os} foi reprovada na verificação por ${autor}. Motivo: <strong>${motivo}</strong>`;
}

export function buildMaintenanceCreatedNotificationMessage(
  resumo: string,
  manutencaoId: number | string,
  projetoNome: string | null,
  timeNome: string,
  usuarioNome: string,
  dataCriacao: string,
): string {
  const projeto = projetoNome
    ? ` vinculada ao projeto <strong>${escapeNotificationHtml(projetoNome)}</strong>`
    : "";
  return `A manutenção <strong>${escapeNotificationHtml(resumo)}</strong> (#${escapeNotificationHtml(String(manutencaoId))})${projeto} foi criada para o time <strong>${escapeNotificationHtml(timeNome)}</strong> por <strong>${escapeNotificationHtml(usuarioNome)}</strong> em ${escapeNotificationHtml(dataCriacao)}.`;
}

export function buildProjectCreatedNotificationMessage(
  projetoNome: string,
  timeNome: string,
  criadorNome: string,
  dataCriacao: string,
): string {
  return `O projeto <strong>${escapeNotificationHtml(projetoNome)}</strong> foi criado por <strong>${escapeNotificationHtml(criadorNome)}</strong> para o time <strong>${escapeNotificationHtml(timeNome)}</strong> em ${escapeNotificationHtml(dataCriacao)}.`;
}

export function buildOSCreatedNotificationMessage(
  osTitulo: string,
  criadorNome: string,
  timeNome: string,
): string {
  osTitulo = `<strong>${escapeNotificationHtml(osTitulo)}</strong>`;
  criadorNome = `<strong>${escapeNotificationHtml(criadorNome)}</strong>`;
  timeNome = `<strong>${escapeNotificationHtml(timeNome)}</strong>`;

  return `A ordem de serviço ${osTitulo} foi aberta por ${criadorNome} do time ${timeNome}.`;
}

function escapeNotificationHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function createNotificationsForTime(
  connection: ConnectionLike,
  payload: {
    titulo: string;
    mensagem: string;
    timeId: number | string | null;
    osId?: number | string | null;
    projetoId?: number | string | null;
    manutencaoId?: number | string | null;
    usuarioOrigemId?: number | string | null;
    incluirUsuarioOrigemComoDestino?: boolean;
    incluirResponsavelDoTimeComoDestino?: boolean;
    // Usuários de fora do time que também devem ser avisados (repetidos e inativos são ignorados).
    usuariosDestinoExtras?: Array<number | string | null | undefined>;
  },
): Promise<number> {
  await ensureNotificationSchema();

  const [destinatarios] = await connection.execute<RowDataPacket[]>(
    `SELECT id_usuario
       FROM usuarios
      WHERE time_id = ?
        AND ativo = TRUE
      ORDER BY id_usuario`,
    [String(payload.timeId)],
  );

  if (payload.incluirResponsavelDoTimeComoDestino) {
    const [responsaveis] = await connection.execute<RowDataPacket[]>(
      `SELECT t.responsavel_id AS id_usuario
         FROM time t
         JOIN usuarios u ON u.id_usuario = t.responsavel_id
        WHERE t.id_time = ? AND u.ativo = TRUE
        LIMIT 1`,
      [String(payload.timeId)],
    );
    const responsavelId = responsaveis[0]?.id_usuario;
    if (
      responsavelId !== undefined &&
      !destinatarios.some((destinatario) => String(destinatario.id_usuario) === String(responsavelId))
    ) {
      destinatarios.push({ id_usuario: responsavelId } as RowDataPacket);
    }
  }

  if (payload.incluirUsuarioOrigemComoDestino && payload.usuarioOrigemId !== undefined && payload.usuarioOrigemId !== null) {
    const origemId = String(payload.usuarioOrigemId);
    if (!destinatarios.some((destinatario) => String(destinatario.id_usuario) === origemId)) {
      const [origemAtiva] = await connection.execute<RowDataPacket[]>(
        `SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND ativo = TRUE LIMIT 1`,
        [origemId],
      );
      if (origemAtiva[0]) destinatarios.push(origemAtiva[0]);
    }
  }

  const extras = [
    ...new Set(
      (payload.usuariosDestinoExtras ?? [])
        .filter((id) => id !== null && id !== undefined)
        .map(String),
    ),
  ].filter((id) => !destinatarios.some((destinatario) => String(destinatario.id_usuario) === id));
  if (extras.length) {
    const [extrasAtivos] = await connection.execute<RowDataPacket[]>(
      `SELECT id_usuario FROM usuarios
        WHERE ativo = TRUE AND id_usuario IN (${extras.map(() => "?").join(", ")})`,
      extras,
    );
    destinatarios.push(...extrasAtivos);
  }

  if (!destinatarios.length) {
    return 0;
  }

  const values: unknown[] = [];
  const placeholders = destinatarios.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");

  for (const destinatario of destinatarios) {
    values.push(
      payload.titulo,
      payload.mensagem,
      payload.timeId === null || payload.timeId === undefined ? null : Number(payload.timeId),
      payload.osId === undefined || payload.osId === null ? null : Number(payload.osId),
      payload.projetoId === undefined || payload.projetoId === null ? null : Number(payload.projetoId),
      payload.manutencaoId === undefined || payload.manutencaoId === null ? null : Number(payload.manutencaoId),
      payload.usuarioOrigemId === undefined || payload.usuarioOrigemId === null ? null : Number(payload.usuarioOrigemId),
      Number(destinatario.id_usuario),
    );
  }

  await connection.execute<ResultSetHeader>(
     `INSERT INTO notificacoes
       (titulo, mensagem, time_id, os_id, projeto_id, manutencao_id, usuario_origem_id, usuario_destino_id)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE notificacao_id = notificacao_id`,
    values,
  );

  return destinatarios.length;
}

type CriticalOSNotificationEvent = "aberta" | "prioridade elevada";

interface CriticalOSNotificationPayload {
  evento: CriticalOSNotificationEvent;
  osId: number | string;
  osTitulo: string;
  timeId: number | string;
  timeNome: string;
  usuarioOrigemId: number | string;
}

async function createCriticalOSNotificationForTime(
  connection: ConnectionLike,
  payload: CriticalOSNotificationPayload,
): Promise<number> {
  return createNotificationsForTime(connection, {
    titulo: buildOSCriticalNotificationTitle(payload.evento),
    mensagem: buildOSCriticalNotificationMessage(
      payload.osId,
      payload.osTitulo,
      payload.evento,
      payload.timeNome,
    ),
    timeId: payload.timeId,
    osId: payload.osId,
    usuarioOrigemId: payload.usuarioOrigemId,
  });
}

export async function createCriticalOSNotificationsForDepartments(
  connection: ConnectionLike,
  payload: Omit<CriticalOSNotificationPayload, "timeId"> & { timeIdResponsavel: number | string },
): Promise<number> {
  const [times] = await connection.execute<RowDataPacket[]>(
    `SELECT id_time
       FROM time
      WHERE LOWER(TRIM(departamento)) IN ('producao', 'software', 'monitoramento', 'implantacao')
         OR id_time = ?
      ORDER BY id_time`,
    [payload.timeIdResponsavel],
  );
  const timeIds = [...new Set(times.map((time) => String(time.id_time)))];
  if (!timeIds.length) return 0;

  await ensureNotificationSchema();
  const [destinatarios] = await connection.execute<RowDataPacket[]>(
    `SELECT id_usuario, time_id
       FROM usuarios
      WHERE ativo = TRUE AND time_id IN (${timeIds.map(() => "?").join(", ")})
      ORDER BY id_usuario`,
    timeIds,
  );
  if (!destinatarios.length) return 0;

  const titulo = buildOSCriticalNotificationTitle(payload.evento);
  const mensagem = buildOSCriticalNotificationMessage(
    payload.osId,
    payload.osTitulo,
    payload.evento,
    payload.timeNome,
  );
  const values: unknown[] = [];
  const placeholders = destinatarios.map(() => "(?, ?, ?, ?, NULL, NULL, ?, ?)").join(", ");
  for (const destinatario of destinatarios) {
    values.push(
      titulo,
      mensagem,
      Number(destinatario.time_id),
      Number(payload.osId),
      Number(payload.usuarioOrigemId),
      Number(destinatario.id_usuario),
    );
  }

  await connection.execute<ResultSetHeader>(
    `INSERT INTO notificacoes
       (titulo, mensagem, time_id, os_id, projeto_id, manutencao_id, usuario_origem_id, usuario_destino_id)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE notificacao_id = notificacao_id`,
    values,
  );

  return destinatarios.length;
}

export async function createCriticalOSNotificationForTimeId(
  connection: ConnectionLike,
  payload: CriticalOSNotificationPayload,
): Promise<number> {
  return createCriticalOSNotificationForTime(connection, payload);
}

export async function createCriticalRelatedNotification(
  connection: ConnectionLike,
  payload: {
    entidade: "projeto" | "manutencao";
    evento: "criada" | "prioridade elevada";
    entidadeId: number | string;
    entidadeNome: string;
    usuarioOrigemId: number | string;
  },
): Promise<number> {
  const [linkedTeams] = await connection.execute<RowDataPacket[]>(
    payload.entidade === "projeto"
      ? `SELECT DISTINCT o.id_time_responsavel AS id_time
           FROM os o
          WHERE o.id_time_responsavel IS NOT NULL
            AND (o.projeto_id = ? OR o.manutencao_id IN (
              SELECT m.manutencao_id FROM manutencoes m WHERE m.projeto_id = ?
            ))`
      : `SELECT DISTINCT o.id_time_responsavel AS id_time
           FROM os o
          WHERE o.manutencao_id = ? AND o.id_time_responsavel IS NOT NULL`,
    payload.entidade === "projeto" ? [payload.entidadeId, payload.entidadeId] : [payload.entidadeId],
  );
  let timeIds = [...new Set(linkedTeams.map((time) => String(time.id_time)))];

  if (!timeIds.length) {
    const [times] = await connection.execute<RowDataPacket[]>(
      `SELECT id_time
         FROM time
        WHERE LOWER(TRIM(departamento)) IN ('producao', 'software', 'monitoramento', 'implantacao')
        ORDER BY id_time`,
    );
    timeIds = [...new Set(times.map((time) => String(time.id_time)))];
  }
  if (!timeIds.length) return 0;

  await ensureNotificationSchema();
  const [users] = await connection.execute<RowDataPacket[]>(
    `SELECT DISTINCT id_usuario, time_id
       FROM usuarios
      WHERE ativo = TRUE AND time_id IN (${timeIds.map(() => "?").join(", ")})
      ORDER BY id_usuario`,
    timeIds,
  );
  const recipients = [...new Map(users.map((user) => [String(user.id_usuario), user])).values()];
  if (!recipients.length) return 0;

  const nomeEntidade = payload.entidade === "projeto" ? "projeto" : "manutenção";
  const titulo = payload.evento === "criada"
    ? payload.entidade === "projeto" ? "Projeto crítico criado" : "Manutenção crítica criada"
    : `Prioridade ${payload.entidade === "projeto" ? "do projeto" : "da manutenção"} elevada para crítica`;
  const entidade = `<strong>${escapeNotificationHtml(payload.entidadeNome)}</strong> (#${escapeNotificationHtml(String(payload.entidadeId))})`;
  const mensagem = payload.evento === "criada"
    ? `${payload.entidade === "projeto" ? "O projeto" : "A manutenção"} ${entidade} foi ${payload.entidade === "projeto" ? "criado" : "criada"} com prioridade crítica.`
    : `A prioridade ${payload.entidade === "projeto" ? "do projeto" : "da manutenção"} ${entidade} foi elevada para crítica.`;
  const projetoId = payload.entidade === "projeto" ? Number(payload.entidadeId) : null;
  const manutencaoId = payload.entidade === "manutencao" ? Number(payload.entidadeId) : null;
  const placeholders = recipients.map(() => "(?, ?, ?, NULL, ?, ?, ?, ?)").join(", ");
  const values: unknown[] = [];

  for (const recipient of recipients) {
    values.push(
      titulo,
      mensagem,
      Number(recipient.time_id),
      projetoId,
      manutencaoId,
      Number(payload.usuarioOrigemId),
      Number(recipient.id_usuario),
    );
  }

  await connection.execute<ResultSetHeader>(
    `INSERT INTO notificacoes
       (titulo, mensagem, time_id, os_id, projeto_id, manutencao_id, usuario_origem_id, usuario_destino_id)
     VALUES ${placeholders}`,
    values,
  );

  return recipients.length;
}

export async function listNotificationsForUser(userId: string | number): Promise<RowDataPacket[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT n.notificacao_id,
            n.titulo,
            n.mensagem,
            n.time_id,
            n.os_id,
            n.projeto_id,
            n.manutencao_id,
            n.usuario_origem_id,
            n.data_criacao,
            o.os_titulo,
            o.os_status,
            p.nome AS projeto_nome,
            m.resumo AS manutencao_resumo,
            t.nome_time,
            u_origem.nome AS origem_nome,
            CASE WHEN nl.usuario_id IS NOT NULL THEN 1 ELSE 0 END AS lida
       FROM notificacoes n
       LEFT JOIN os o ON o.os_id = n.os_id
      LEFT JOIN projetos p ON p.projeto_id = n.projeto_id
        LEFT JOIN manutencoes m ON m.manutencao_id = n.manutencao_id
       LEFT JOIN time t ON t.id_time = n.time_id
       LEFT JOIN usuarios u_origem ON u_origem.id_usuario = n.usuario_origem_id
       LEFT JOIN notificacao_leituras nl ON nl.notificacao_id = n.notificacao_id AND nl.usuario_id = ?
      WHERE n.usuario_destino_id = ?
      ORDER BY n.data_criacao DESC, n.notificacao_id DESC`,
    [userId, userId],
  );

  return rows;
}

export async function countUnreadNotificationsForUser(userId: string | number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
       FROM notificacoes n
       LEFT JOIN notificacao_leituras nl
         ON nl.notificacao_id = n.notificacao_id AND nl.usuario_id = ?
      WHERE n.usuario_destino_id = ?
        AND nl.usuario_id IS NULL`,
    [userId, userId],
  );

  return Number(rows[0]?.total ?? 0);
}

export async function markNotificationAsReadByUser(
  notificacaoId: string | number,
  userId: string | number,
): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO notificacao_leituras (notificacao_id, usuario_id, data_leitura)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE data_leitura = VALUES(data_leitura)`,
    [Number(notificacaoId), Number(userId)],
  );

  return Boolean(result.affectedRows || result.insertId);
}

export function createNotificacoesRouter(requireAuth: RequestHandler): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const user = res.locals.user as User;
    try {
      const notificacoes = await listNotificationsForUser(user.id);
      return res.json({
        notificacoes: notificacoes.map((item) => ({
          id: String(item.notificacao_id),
          titulo: item.titulo as string,
          mensagem: item.mensagem as string,
          time_id: item.time_id === null ? null : String(item.time_id),
          os_id: item.os_id === null ? null : String(item.os_id),
          projeto_id: item.projeto_id === null ? null : String(item.projeto_id),
          projeto_nome: item.projeto_nome as string | null,
          manutencao_id: item.manutencao_id === null ? null : String(item.manutencao_id),
          manutencao_resumo: item.manutencao_resumo as string | null,
          os_titulo: item.os_titulo as string | null,
          os_status: item.os_status as string | null,
          time_nome: item.nome_time as string | null,
          usuario_origem_id: item.usuario_origem_id === null ? null : String(item.usuario_origem_id),
          usuario_origem_nome: item.origem_nome as string | null,
          data_criacao: item.data_criacao as string,
          lida: Number(item.lida ?? 0) === 1,
        })),
      });
    } catch (error) {
      console.error("Erro ao listar notificações:", error);
      return res.status(500).json({ message: "Não foi possível consultar as notificações." });
    }
  });

  router.get("/nao-lidas/count", requireAuth, async (req, res) => {
    const user = res.locals.user as User;
    try {
      const total = await countUnreadNotificationsForUser(user.id);
      return res.json({ total });
    } catch (error) {
      console.error("Erro ao contar notificações não lidas:", error);
      return res.status(500).json({ message: "Não foi possível consultar as notificações não lidas." });
    }
  });

  router.patch("/:notificacaoId/ler", requireAuth, async (req, res) => {
    const user = res.locals.user as User;
    const notId = req.params.notificacaoId;

    if (!/^\d+$/.test(notId)) {
      return res.status(404).json({ message: "Notificação não encontrada." });
    }

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT notificacao_id
           FROM notificacoes
          WHERE notificacao_id = ?
            AND usuario_destino_id = ?
          LIMIT 1`,
        [notId, user.id],
      );

      if (!rows.length) {
        return res.status(404).json({ message: "Notificação não encontrada." });
      }

      await markNotificationAsReadByUser(notId, user.id);
      return res.json({ message: "Notificação marcada como lida." });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return res.status(500).json({ message: "Não foi possível atualizar o status da notificação." });
    }
  });

  return router;
}
