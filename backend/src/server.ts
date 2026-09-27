import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import crypto from "node:crypto";
import { promisify } from "node:util";
import dotenv from "dotenv";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role, User } from "./users.js";
import type { Time } from "./times.js";

// =====================================================
// CONFIGURAÇÃO
// =====================================================

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Sessões são deliberadamente temporárias: dados de negócio permanecem no MySQL.
const sessions = new Map<string, string>();

const validRoles: Role[] = [
  "superusuario",
  "gestor",
  "comercial",
  "suporte",
  "producao",
  "software",
  "implantacao",
];

// =====================================================
// TIPOS DE BANCO
// =====================================================

type UserRow = RowDataPacket & {
  id_usuario: number;
  nome: string;
  email: string;
  cargo: Role;
  senha_hash: string;
  ativo: number | boolean;
  time_id: number | null;
};

type TimeRow = RowDataPacket & {
  id_time: number;
  nome_time: string;
  email_time: string | null;
  departamento: string;
  responsavel_id: number | null;
};

type OSRow = RowDataPacket & {
  os_id: number;
  os_titulo: string;
  os_descricao: string | null;
  os_status: string;
  prioridade: string;
  os_cliente: string;
  data_limite: string | null;
  id_criador: number;
  id_time_responsavel: number | null;
  data_criacao: string;
};

// =====================================================
// SENHAS
// =====================================================

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Compatibilidade temporária com bases antigas que ainda possam ter senha em texto.
  if (!stored.startsWith("scrypt:")) {
    const current = Buffer.from(password);
    const legacy = Buffer.from(stored);
    return current.length === legacy.length && crypto.timingSafeEqual(current, legacy);
  }

  const [, salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");

  return expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey);
}

// =====================================================
// SERIALIZAÇÃO
// =====================================================

function publicUser(row: UserRow): User {
  return {
    id: String(row.id_usuario),
    name: row.nome,
    email: row.email,
    role: row.cargo,
    active: Boolean(row.ativo),
    time_id: row.time_id === null ? null : String(row.time_id),
  };
}

async function getUserById(id: string): Promise<UserRow | undefined> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id_usuario, nome, email, cargo, senha_hash, ativo, time_id
       FROM usuarios
      WHERE id_usuario = ?
      LIMIT 1`,
    [id],
  );

  return rows[0];
}

async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id_usuario, nome, email, cargo, senha_hash, ativo, time_id
       FROM usuarios
      WHERE LOWER(email) = LOWER(?)
      LIMIT 1`,
    [email.trim()],
  );

  return rows[0];
}

async function getTimeById(id: string): Promise<TimeRow | undefined> {
  const [rows] = await pool.execute<TimeRow[]>(
    `SELECT id_time, nome_time, email_time, departamento, responsavel_id
       FROM time
      WHERE id_time = ?
      LIMIT 1`,
    [id],
  );

  return rows[0];
}

async function buildPublicTime(row: TimeRow): Promise<Time> {
  const [users] = await pool.execute<UserRow[]>(
    `SELECT id_usuario, nome, email, cargo, senha_hash, ativo, time_id
       FROM usuarios
      WHERE time_id = ?
      ORDER BY nome`,
    [row.id_time],
  );

  let responsavel: User | null = null;
  if (row.responsavel_id !== null) {
    const responsible = await getUserById(String(row.responsavel_id));
    if (responsible) responsavel = publicUser(responsible);
  }

  return {
    id: String(row.id_time),
    nome_time: row.nome_time,
    departamento: row.departamento,
    responsavel_id: row.responsavel_id === null ? null : String(row.responsavel_id),
    responsavel,
    pessoasVinculadas: users.map(publicUser),
  };
}

// =====================================================
// AUTENTICAÇÃO E AUTORIZAÇÃO
// =====================================================

async function getAuthenticatedUser(req: Request): Promise<User | undefined> {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return undefined;

  const token = header.slice(7);
  const userId = sessions.get(token);
  if (!userId) return undefined;

  const row = await getUserById(userId);
  if (!row || !Boolean(row.ativo)) {
    sessions.delete(token);
    return undefined;
  }

  return publicUser(row);
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: "Sessão inválida ou expirada." });
    }

    res.locals.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(503).json({ message: "Não foi possível consultar o banco de dados." });
  }
}

function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ message: "Sessão inválida ou expirada." });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Você não possui permissão para esta operação." });
      }

      res.locals.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(503).json({ message: "Não foi possível consultar o banco de dados." });
    }
  };
}

// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ api: true, database: true, message: "Backend e banco de dados funcionando." });
  } catch (error) {
    console.error(error);
    res.status(503).json({ api: true, database: false, message: "Backend funcionando, mas o banco não está disponível." });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.senha_hash))) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    if (!Boolean(user.ativo)) {
      return res.status(403).json({ message: "Este usuário está desativado. Entre em contato com o administrador." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, String(user.id_usuario));

    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(503).json({ message: "Não foi possível conectar ao banco de dados." });
  }
});

// =====================================================
// LOGOUT / CONTA
// =====================================================

app.post("/api/logout", requireAuth, (req, res) => {
  const token = (req.headers.authorization ?? "").slice(7);
  sessions.delete(token);
  res.json({ message: "Sessão encerrada." });
});

app.get("/api/account", requireAuth, (req, res) => {
  res.json({ user: res.locals.user as User });
});

app.put("/api/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "A nova senha deve possuir pelo menos 6 caracteres." });
  }

  try {
    const user = await getUserById((res.locals.user as User).id);
    if (!user || !(await verifyPassword(currentPassword, user.senha_hash))) {
      return res.status(401).json({ message: "A senha atual está incorreta." });
    }

    const newHash = await hashPassword(newPassword);
    await pool.execute("UPDATE usuarios SET senha_hash = ? WHERE id_usuario = ?", [newHash, user.id_usuario]);

    res.json({ message: "Senha atualizada com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível alterar a senha." });
  }
});

// =====================================================
// USUÁRIOS
// =====================================================

app.get("/api/users", requireRole("superusuario", "gestor"), async (_req, res) => {
  try {
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT id_usuario, nome, email, cargo, senha_hash, ativo, time_id
         FROM usuarios
        ORDER BY nome`,
    );

    res.json({ users: rows.map(publicUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível consultar os usuários." });
  }
});

app.post("/api/users", requireRole("superusuario", "gestor"), async (req, res) => {
  const { name, email, password, role, time_id } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    time_id?: string | null;
  };

  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({ message: "Nome, email, senha e perfil são obrigatórios." });
  }
  if (!validRoles.includes(role)) return res.status(400).json({ message: "Perfil inválido." });
  if (password.length < 6) return res.status(400).json({ message: "A senha deve possuir pelo menos 6 caracteres." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT id_usuario FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email.trim()],
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: "Este email já está cadastrado." });
    }

    if (time_id) {
      const [timeRows] = await connection.execute<RowDataPacket[]>(
        "SELECT id_time FROM time WHERE id_time = ? LIMIT 1",
        [time_id],
      );
      if (!timeRows.length) {
        await connection.rollback();
        return res.status(400).json({ message: "Time inválido." });
      }
    }

    const passwordHash = await hashPassword(password);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuarios (nome, email, cargo, senha_hash, ativo, time_id)
       VALUES (?, ?, ?, ?, TRUE, ?)`,
      [name.trim(), email.trim().toLowerCase(), role, passwordHash, time_id || null],
    );

    await connection.commit();

    const created = await getUserById(String(result.insertId));
    if (!created) return res.status(500).json({ message: "Usuário criado, mas não foi possível recuperá-lo." });

    res.status(201).json({ user: publicUser(created) });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Não foi possível cadastrar o usuário." });
  } finally {
    connection.release();
  }
});

app.put("/api/users/:id", requireRole("superusuario"), async (req, res) => {
  const id = req.params.id;
  const { name, email, password, role, active, time_id } = req.body as Partial<{
    name: string;
    email: string;
    password: string;
    role: Role;
    active: boolean;
    time_id: string | null;
  }>;

  if (role !== undefined && !validRoles.includes(role)) {
    return res.status(400).json({ message: "Perfil inválido." });
  }
  if (password !== undefined && password.length < 6) {
    return res.status(400).json({ message: "A senha deve possuir pelo menos 6 caracteres." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute<UserRow[]>(
      `SELECT id_usuario, nome, email, cargo, senha_hash, ativo, time_id
         FROM usuarios WHERE id_usuario = ? FOR UPDATE`,
      [id],
    );
    const current = rows[0];
    if (!current) {
      await connection.rollback();
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (email !== undefined) {
      const [duplicate] = await connection.execute<RowDataPacket[]>(
        `SELECT id_usuario FROM usuarios
          WHERE LOWER(email) = LOWER(?) AND id_usuario <> ? LIMIT 1`,
        [email.trim(), id],
      );
      if (duplicate.length) {
        await connection.rollback();
        return res.status(409).json({ message: "Este email já está cadastrado." });
      }
    }

    if (time_id !== undefined && time_id !== null) {
      const [timeRows] = await connection.execute<RowDataPacket[]>(
        "SELECT id_time FROM time WHERE id_time = ? LIMIT 1",
        [time_id],
      );
      if (!timeRows.length) {
        await connection.rollback();
        return res.status(400).json({ message: "Time inválido." });
      }
    }

    const newTimeId = time_id === undefined ? current.time_id : time_id;
    const newHash = password === undefined ? current.senha_hash : await hashPassword(password);

    await connection.execute(
      `UPDATE usuarios
          SET nome = ?, email = ?, cargo = ?, senha_hash = ?, ativo = ?, time_id = ?
        WHERE id_usuario = ?`,
      [
        name === undefined ? current.nome : name.trim(),
        email === undefined ? current.email : email.trim().toLowerCase(),
        role === undefined ? current.cargo : role,
        newHash,
        active === undefined ? Boolean(current.ativo) : active,
        newTimeId,
        id,
      ],
    );

    if (time_id !== undefined && String(current.time_id ?? "") !== String(time_id ?? "")) {
      if (current.time_id !== null) {
        await connection.execute(
          "UPDATE time SET responsavel_id = NULL WHERE id_time = ? AND responsavel_id = ?",
          [current.time_id, id],
        );
      }
    }

    if (active === false) {
      for (const [token, userId] of sessions) {
        if (userId === id) sessions.delete(token);
      }
    }

    await connection.commit();

    const updated = await getUserById(id);
    if (!updated) return res.status(500).json({ message: "Não foi possível recuperar o usuário atualizado." });

    res.json({ user: publicUser(updated) });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Não foi possível editar o usuário." });
  } finally {
    connection.release();
  }
});

app.delete("/api/users/:id", requireRole("superusuario"), async (req, res) => {
  const currentUser = res.locals.user as User;
  if (currentUser.id === req.params.id) {
    return res.status(400).json({ message: "O próprio usuário logado não pode ser excluído." });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM usuarios WHERE id_usuario = ?",
      [req.params.id],
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível excluir o usuário." });
  }
});

// =====================================================
// TIMES
// =====================================================

app.get("/api/times", requireRole("superusuario", "gestor"), async (_req, res) => {
  try {
    const [rows] = await pool.execute<TimeRow[]>(
      `SELECT id_time, nome_time, email_time, departamento, responsavel_id
         FROM time ORDER BY nome_time`,
    );

    const result = await Promise.all(rows.map(buildPublicTime));
    res.json({ times: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível consultar os times." });
  }
});

async function validateTimePayload(
  nome_time: string | undefined,
  departamento: string | undefined,
  responsavel_id: string | null | undefined,
  usuarios_ids: string[] | undefined,
  ignoreId?: string,
) {
  if (!nome_time?.trim() || !departamento?.trim()) {
    return "Nome do time e equipe relacionada são obrigatórios.";
  }

  const ids = [...new Set(Array.isArray(usuarios_ids) ? usuarios_ids.map(String) : [])];
  if (responsavel_id && !ids.includes(String(responsavel_id))) ids.push(String(responsavel_id));

  if (responsavel_id) {
    const responsible = await getUserById(String(responsavel_id));
    if (!responsible) return "Pessoa responsável inválida.";
  }

  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id_usuario FROM usuarios WHERE id_usuario IN (${placeholders})`,
      ids,
    );
    if (rows.length !== ids.length) return "Uma ou mais pessoas vinculadas são inválidas.";
  }

  const [duplicates] = await pool.execute<RowDataPacket[]>(
    `SELECT id_time FROM time WHERE LOWER(nome_time) = LOWER(?) ${ignoreId ? "AND id_time <> ?" : ""} LIMIT 1`,
    ignoreId ? [nome_time.trim(), ignoreId] : [nome_time.trim()],
  );
  if (duplicates.length) return "Este time já está cadastrado.";

  return null;
}

app.post("/api/times", requireRole("superusuario", "gestor"), async (req, res) => {
  const { nome_time, departamento, responsavel_id, usuarios_ids } = req.body as {
    nome_time?: string;
    departamento?: string;
    responsavel_id?: string | null;
    usuarios_ids?: string[];
  };

  try {
    const error = await validateTimePayload(nome_time, departamento, responsavel_id, usuarios_ids);
    if (error) return res.status(400).json({ message: error });

    const ids = [...new Set([...(usuarios_ids ?? []).map(String), ...(responsavel_id ? [String(responsavel_id)] : [])])];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO time (nome_time, email_time, departamento, responsavel_id)
         VALUES (?, NULL, ?, ?)`,
        [nome_time!.trim(), departamento!.trim(), responsavel_id || null],
      );

      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        await connection.execute(
          `UPDATE usuarios SET time_id = ? WHERE id_usuario IN (${placeholders})`,
          [result.insertId, ...ids],
        );
      }

      await connection.commit();
      const created = await getTimeById(String(result.insertId));
      if (!created) return res.status(500).json({ message: "Time criado, mas não foi possível recuperá-lo." });
      res.status(201).json({ time: await buildPublicTime(created) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível cadastrar o time." });
  }
});

app.put("/api/times/:id", requireRole("superusuario", "gestor"), async (req, res) => {
  const { nome_time, departamento, responsavel_id, usuarios_ids } = req.body as {
    nome_time?: string;
    departamento?: string;
    responsavel_id?: string | null;
    usuarios_ids?: string[];
  };

  try {
    const current = await getTimeById(req.params.id);
    if (!current) return res.status(404).json({ message: "Time não encontrado." });

    const error = await validateTimePayload(nome_time, departamento, responsavel_id, usuarios_ids, req.params.id);
    if (error) return res.status(400).json({ message: error });

    const ids = [...new Set([...(usuarios_ids ?? []).map(String), ...(responsavel_id ? [String(responsavel_id)] : [])])];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE time SET nome_time = ?, departamento = ?, responsavel_id = ? WHERE id_time = ?`,
        [nome_time!.trim(), departamento!.trim(), responsavel_id || null, req.params.id],
      );

      await connection.execute("UPDATE usuarios SET time_id = NULL WHERE time_id = ?", [req.params.id]);

      if (ids.length) {
        const placeholders = ids.map(() => "?").join(",");
        await connection.execute(
          `UPDATE usuarios SET time_id = ? WHERE id_usuario IN (${placeholders})`,
          [req.params.id, ...ids],
        );
      }

      await connection.commit();
      const updated = await getTimeById(req.params.id);
      if (!updated) return res.status(500).json({ message: "Não foi possível recuperar o time atualizado." });
      res.json({ time: await buildPublicTime(updated) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível editar o time." });
  }
});

app.delete("/api/times/:id", requireRole("superusuario", "gestor"), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("UPDATE usuarios SET time_id = NULL WHERE time_id = ?", [req.params.id]);
    const [result] = await connection.execute<ResultSetHeader>("DELETE FROM time WHERE id_time = ?", [req.params.id]);

    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: "Time não encontrado." });
    }

    await connection.commit();
    res.json({ message: "Time excluído com sucesso." });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Não foi possível excluir o time." });
  } finally {
    connection.release();
  }
});

// =====================================================
// ORDENS DE SERVIÇO
// =====================================================

app.get("/api/os", requireAuth, async (_req, res) => {
  try {
    const [rows] = await pool.execute<OSRow[]>(
      `SELECT os_id, os_titulo, os_descricao, os_status, prioridade, os_cliente,
              data_limite, id_criador, id_time_responsavel, data_criacao
         FROM os ORDER BY data_criacao DESC`,
    );
    res.json({ os: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Não foi possível consultar as ordens de serviço." });
  }
});

app.post("/api/os", requireAuth, async (req, res) => {
  const {
    os_titulo,
    os_descricao,
    prioridade,
    os_cliente,
    data_limite,
    id_time_responsavel,
  } = req.body as {
    os_titulo?: string;
    os_descricao?: string;
    prioridade?: string;
    os_cliente?: string;
    data_limite?: string;
    id_time_responsavel?: string | number | null;
  };

  const priorities = ["baixa", "media", "alta", "critica"];
  if (!os_titulo?.trim() || !os_cliente?.trim() || !os_descricao?.trim() || !prioridade || !data_limite || !id_time_responsavel) {
    return res.status(400).json({ message: "Título, descrição, cliente, prioridade, data limite e time responsável são obrigatórios." });
  }
  if (!priorities.includes(prioridade)) return res.status(400).json({ message: "Prioridade inválida." });

  try {
    const time = await getTimeById(String(id_time_responsavel));
    if (!time) return res.status(400).json({ message: "Time responsável inválido." });

    const creator = res.locals.user as User;
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO os
        (os_titulo, os_descricao, os_status, prioridade, os_cliente, data_limite, id_criador, id_time_responsavel)
       VALUES (?, ?, 'aberta', ?, ?, ?, ?, ?)`,
      [os_titulo.trim(), os_descricao.trim(), prioridade, os_cliente.trim(), data_limite, creator.id, id_time_responsavel],
    );

    res.status(201).json({
      message: "Ordem de serviço aberta com sucesso!",
      os: { os_id: result.insertId, os_status: "aberta" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao abrir a ordem de serviço." });
  }
});

// =====================================================
// ERROS E START
// =====================================================

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`Backend Express rodando em http://localhost:${PORT}`);
});
