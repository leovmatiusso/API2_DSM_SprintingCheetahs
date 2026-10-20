import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [result] = await pool.query(
      `SELECT
        o.os_id,
        o.os_titulo,
        o.os_descricao,
        o.prioridade,
        o.id_criador,
        o.data_criacao
      FROM os o
      WHERE o.os_status = 'concluida'`
    );

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      erro: "Falha ao buscar ordens de serviço"
    });
  }
});

export default router;
