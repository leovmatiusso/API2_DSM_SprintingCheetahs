import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const router = express.Router();


// ---------------------- Cadastra/Salva o time no banco de dados ---------------------- //
router.post("/", async (req, res) => {
    try {
        const { nome_time, email_time, departamento, responsavel_id } = req.body; //pega os campos da tabela "times"

        const [result] = await pool.query(
            "insert into times (nome_time, email_time, departamento, responsavel_id) values (?, ?, ?, ?)", // insere os dados obtidos na tabela
            [nome_time, email_time, departamento, responsavel_id]
        );

        res.status(201).json({ id: result.insertId, nome_time, email_time });
    }
    catch (e) {
        res.status(500).json({ erro: "Falha ao criar time" }); // mensagem caso dê erro
    }
});


// ---------------------- Edita o time no banco de dados ---------------------- //
const campos_permitidos = ["nome_time", "email_time", "departamento", "responsavel_id"]; //pega campos que podem ter dados alterados

router.put("/:time_id", async (req, res) => {
    try {
        const { time_id } = req.params;

        const camposEnviados = Object.keys(req.body).filter((campo) => campos_permitidos.includes(campo));

        if (camposEnviados.length === 0) {
            return res.status(400).json({ erro: "Nenhum campo válido para atualizar foi enviado!" });
        }

        const setClause = camposEnviados.map((campo) => `${campo} = ?`).join(", ");
        const valores = camposEnviados.map((campo) => req.body[campo]);

        const [result] = await pool.query(`UPDATE times SET ${setClause} WHERE time_id = ?`, [...valores, time_id]); //faz a edição no lugar certo

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Time não encontrado" });
        }

        res.status(200).json({ mensagem: "Time atualizado com sucesso", time_id, camposAtualizados: camposEnviados });
    }
    catch (e) {
        res.status(500).json({ erro: "Falha ao atualizar time" });
    }
});


// ---------------------- Deleta o time do banco de dados ---------------------- //
router.delete("/:time_id", async (req, res) => {
    try {
        const { time_id } = req.params;

        const [result] = await pool.query(
            "delete from times where time_id = ?",
            [time_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Time não encontrado!" });
        }

        res.status(200).json({ mensagem: "Time excluído com sucesso!", time_id });
    }
    catch (e) {
        res.status(500).json({ erro: "Falha ao excluir time" });
    }
});


export default router;