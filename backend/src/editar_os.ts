import express from "express";
import dotenv from "dotenv";
import { ResultSetHeader } from "mysql2";
import { pool } from "./db.js";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { os_status, os_id } = req.body;

        const [result] = await pool.query(
            "UPDATE os SET os_status = ? WHERE os_id = ?",
            [os_status, os_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                erro: "Ordem de serviço não encontrada"
            });
        }

        res.status(200).json({
            mensagem: "Status atualizado com sucesso",
            os_id,
            os_status
        });

    } catch (e) {
        res.status(500).json({
            erro: "Falha ao atualizar status"
        });
    }
});

export default router;