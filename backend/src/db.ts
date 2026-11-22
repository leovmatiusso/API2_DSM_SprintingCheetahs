import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "node:async_hooks";
import type { User } from "./users.js";

dotenv.config();

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.warn(`Variáveis de banco ausentes: ${missing.join(", ")}. Configure o arquivo .env antes de iniciar o backend.`);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
  queueLimit: 0,
  charset: "utf8mb4",
});

type AuditActor = Pick<User, "id" | "email">;
const auditActor = new AsyncLocalStorage<AuditActor | null>();

export function runWithAuditActor<T>(actor: AuditActor, callback: () => T): T {
  return auditActor.run(actor, callback);
}

const originalGetConnection = pool.getConnection.bind(pool);

async function prepareConnectionForActor(connection: Awaited<ReturnType<typeof originalGetConnection>>) {
  const actor = auditActor.getStore();
  await connection.execute(
    "SET @app_actor_id = ?, @app_actor_email = ?",
    [actor?.id ?? null, actor?.email ?? null],
  );
  return connection;
}

// Direct transactional routes acquire a connection here, so its actor context
// is set on that exact connection before any write can fire a database trigger.
(pool as unknown as { getConnection: typeof pool.getConnection }).getConnection = async () => {
  const connection = await originalGetConnection();
  try {
    return await prepareConnectionForActor(connection);
  } catch (error) {
    connection.release();
    throw error;
  }
};

// Pool-level query/execute methods normally choose their own connection. Route
// them through an explicitly prepared connection so triggers always see the
// authenticated actor, including outside explicit transactions.
async function executeWithActor(method: "execute" | "query", sql: string, values?: unknown) {
  const connection = await originalGetConnection();
  try {
    await prepareConnectionForActor(connection);
    return method === "execute"
      ? await connection.execute(sql, values as never)
      : await connection.query(sql, values as never);
  } finally {
    connection.release();
  }
}

(pool as unknown as { execute: typeof pool.execute }).execute = ((sql: string, values?: unknown) =>
  executeWithActor("execute", sql, values)) as typeof pool.execute;
(pool as unknown as { query: typeof pool.query }).query = ((sql: string, values?: unknown) =>
  executeWithActor("query", sql, values)) as typeof pool.query;
