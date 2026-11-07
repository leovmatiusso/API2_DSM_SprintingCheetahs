import express from "express";
import { pool } from "./db.js";
import type { RowDataPacket } from "mysql2";

const router = express.Router();

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute<RowDataPacket[]>(
            `SELECT 

            os_titulo,
            id_time_responsavel,
            os_status,
            data_limite,
            tipo_acao

            FROM historico
            WHERE os_id = ? `,
            [
                id
            ]
        );

        if (result.length === 0) {
            return res.status(404).json({
                erro: "Ordem de serviço não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Ordens de serviço encontradas com sucesso",
            historico: result
        });

    } catch (e) {
        console.error(e);

        return res.status(500).json({
            erro: "Falha ao acessar o histórico das ordens de serviço"
        });
    }
});

export default router;