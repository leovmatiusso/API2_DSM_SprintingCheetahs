import mysql from "mysql2/promise";
import dotenv from "dotenv";

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
