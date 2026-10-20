import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {  } = req.body; 

        const [result] = await pool.query(
            "select o.os_titulo,o.os_descricao,o.prioridade,o.id_criador,o.datacriacao from os o inner join time t on t.id_time = o.id_time_responsavel where o.status = 'concluida' ", // insere os dados obtidos na tabela
            []
        );
    }
    catch (e) {
        res.status(500).json({ erro: "Falha ao criar time" });
    }
});

//nem sei mais oq eu to fazendo, só sei q ta errado e to com muito sono pra continuar
