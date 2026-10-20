import { Router, type Request, type RequestHandler, type Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { User } from "./users.js";

export async function ensureNotificationSchema(): Promise<void> {
  const [projectColumns] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM projetos`);
  const projectColumnNames = new Set(projectColumns.map((column) => column.Field));
  if (!projectColumnNames.has("id_time_responsavel")) {
    await pool.query(`ALTER TABLE projetos ADD COLUMN id_time_responsavel INT NULL AFTER vendedor_id`);
  }

  const [projectIndexes] = await pool.query<RowDataPacket[]>(`SHOW INDEX FROM projetos`);
  const projectIndexNames = new Set(projectIndexes.map((index) => index.Key_name));
  if (!projectIndexNames.has("idx_projetos_time_responsavel")) {
    await pool.query(`ALTER TABLE projetos ADD INDEX idx_projetos_time_responsavel (id_time_responsavel)`);
  }

  const [projectConstraints] = await pool.query<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'projetos'
        AND CONSTRAINT_NAME = 'fk_projeto_time_responsavel'`,
  );
  if (!projectConstraints.length) {
    await pool.query(
      `ALTER TABLE projetos
       ADD CONSTRAINT fk_projeto_time_responsavel
       FOREIGN KEY (id_time_responsavel) REFERENCES time(id_time)
       ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  const [maintenanceColumns] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM manutencoes`);
  const maintenanceColumnNames = new Set(maintenanceColumns.map((column) => column.Field));
  if (!maintenanceColumnNames.has("id_time_responsavel")) {
    await pool.query(`ALTER TABLE manutencoes ADD COLUMN id_time_responsavel INT NULL AFTER responsavel_id`);
  }

  const [maintenanceIndexes] = await pool.query<RowDataPacket[]>(`SHOW INDEX FROM manutencoes`);
  const maintenanceIndexNames = new Set(maintenanceIndexes.map((index) => index.Key_name));
  if (!maintenanceIndexNames.has("idx_manutencao_time_responsavel")) {
    await pool.query(`ALTER TABLE manutencoes ADD INDEX idx_manutencao_time_responsavel (id_time_responsavel)`);
  }

  const [maintenanceTeamConstraints] = await pool.query<RowDataPacket[]>(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'manutencoes'
        AND CONSTRAINT_NAME = 'fk_manutencao_time_responsavel'`,
  );
  if (!maintenanceTeamConstraints.length) {
    await pool.query(
      `ALTER TABLE manutencoes
       ADD CONSTRAINT fk_manutencao_time_responsavel
       FOREIGN KEY (id_time_responsavel) REFERENCES time(id_time)
       ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

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
        UNIQUE INDEX uq_notificacoes_projeto_destino (projeto_id, usuario_destino_id),
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
  if (!indexNames.has("uq_notificacoes_projeto_destino")) {
    await pool.query(
      `ALTER TABLE notificacoes ADD UNIQUE INDEX uq_notificacoes_projeto_destino (projeto_id, usuario_destino_id)`,
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
    timeId: number | string;
    osId?: number | string | null;
    projetoId?: number | string | null;
    manutencaoId?: number | string | null;
    usuarioOrigemId?: number | string | null;
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

  if (!destinatarios.length) {
    return 0;
  }

  const values: unknown[] = [];
  const placeholders = destinatarios.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");

  for (const destinatario of destinatarios) {
    values.push(
      payload.titulo,
      payload.mensagem,
      Number(payload.timeId),
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
