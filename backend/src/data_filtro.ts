import { Router } from "express";
import type { RequestHandler } from "express";
import type { RowDataPacket } from "mysql2";

import { pool } from "./db.js";
import type { Role } from "./users.js";

type RequireRole = (...roles: Role[]) => RequestHandler;

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const parsed = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === data;
}

export function createDataFiltroRouter(requireRole: RequireRole): Router {
  const router = Router();

  router.get("/", requireRole("superusuario", "gestor"), async (req, res) => {
    const data = typeof req.query.data === "string" ? req.query.data : "";
    if (!dataValida(data)) {
      return res.status(400).json({ message: "Informe uma data válida no formato AAAA-MM-DD." });
    }

    try {
      const [historico] = await pool.execute<RowDataPacket[]>(
        `SELECT h.historico_id,
                h.os_id,
                h.os_titulo,
                h.tipo_acao,
                h.os_status,
                h.id_time_responsavel,
                t.nome_time,
                DATE_FORMAT(h.data_limite, '%Y-%m-%d') AS data_limite
           FROM historico h
           LEFT JOIN time t ON t.id_time = h.id_time_responsavel
          WHERE h.data_limite = ?
          ORDER BY h.historico_id DESC`,
        [data],
      );

      return res.json({ historico });
    } catch (error) {
      console.error("Erro ao filtrar histórico pela data:", error);
      return res.status(500).json({ message: "Não foi possível filtrar o histórico pela data." });
    }
  });

  return router;
}
