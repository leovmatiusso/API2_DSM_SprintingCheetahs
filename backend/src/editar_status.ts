import express from "express";
import { pool } from "./db.js";

const router = express.Router();

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            os_status
        } = req.body;

        if (typeof os_status !== "string" || !os_status.trim()) {
            return res.status(400).json({
                erro: "O status é obrigatório"
            });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE os
             SET os_status = ?
             WHERE os_id = ?`,
            [
                os_status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                erro: "Ordem de serviço não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Status atualizada com sucesso"
        });

    } catch (e) {
        console.error(e);

        return res.status(500).json({
            erro: "Falha ao atualizar ordem de serviço"
        });
    }
});

export default router;