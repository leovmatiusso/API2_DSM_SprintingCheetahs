import express from "express";
import { pool } from "./db.js";

const router = express.Router();

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            os_titulo,
            os_descricao,
            os_status,
            prioridade,
            os_cliente,
            data_limite,
            id_time_responsavel
        } = req.body;

        if (
            !os_titulo ||
            !os_descricao ||
            !os_status ||
            !prioridade ||
            !os_cliente ||
            !data_limite ||
            id_time_responsavel == null
        ) {
            await pool.execute(
                "UPDATE os SET os_status = ? WHERE os_id = ?",
                ["bloqueada", id]
            );
        
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios",
                os_status: "bloqueado"
            });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE os
             SET os_titulo = ?,
                 os_descricao = ?,
                 os_status = ?,
                 prioridade = ?,
                 os_cliente = ?,
                 data_limite = ?,
                 id_time_responsavel = ?
             WHERE os_id = ?`,
            [
                os_titulo,
                os_descricao,
                os_status,
                prioridade,
                os_cliente,
                data_limite,
                id_time_responsavel,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                erro: "Ordem de serviço não encontrada"
            });
        }

        return res.status(200).json({
            mensagem: "Ordem de serviço atualizada com sucesso"
        });

    } catch (e) {
        console.error(e);

        return res.status(500).json({
            erro: "Falha ao atualizar ordem de serviço"
        });
    }
});

export default router;