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

export function createHistoricoRouter(requireRole: RequireRole): Router {
  const router = Router();
  const perfis = ["superusuario", "gestor"] as const;

  router.get("/", requireRole(...perfis), async (req, res) => {
    const data = typeof req.query.data === "string" ? req.query.data : undefined;

    if (data && !dataValida(data)) {
      return res.status(400).json({ message: "Data do filtro inválida." });
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
          WHERE (? IS NULL OR h.data_limite = ?)
          ORDER BY h.historico_id DESC`,
        [data ?? null, data ?? null],
      );

      return res.json({ historico });
    } catch (error) {
      console.error("Erro ao listar histórico:", error);
      return res.status(500).json({ message: "Não foi possível carregar o histórico." });
    }
  });

  router.get("/:id", requireRole(...perfis), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Identificador da ordem de serviço inválido." });
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
          WHERE h.os_id = ?
          ORDER BY h.historico_id DESC`,
        [id],
      );

      return res.json({ historico });
    } catch (error) {
      console.error("Erro ao carregar histórico da OS:", error);
      return res.status(500).json({ message: "Não foi possível carregar o histórico da OS." });
    }
  });

  return router;
}
