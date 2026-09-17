import express from "express";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config()

const app = express ()


// ---------------------- Cadastra/Salva o time no banco de dados ---------------------- //
app.post("/", async (req, res) =>{
    try{
        const { nome_time, email_time, departamento, responsavel_id } = req.body; //pega os campos da tabela "times"
        const [result] = await pool.query(
            "insert into times (nome_time, email_time, departamento, responsavel_id) values (?, ?, ?, ?)", // insere os dados obtidos na tabela
            [nome_time, email_time, departamento, responsavel_id]);
        res.status(201).json({ id: result.insertId, nome_time, email_time}); 
    }
    catch (e) {
        res.status(500).json({ erro: "Falha ao criar time"}) // mensagem caso dê erro
    }
});

// ---------------------- Edita o time no banco de dados ---------------------- //



// ---------------------- Deleta o time do banco de dados ---------------------- //
app.delete("/:time_id", async (req, res) =>{
    try{
        const { time_id } = req.params;

        const { result } = await pool.query(
            "delete from times where time_id = ?", 
            [time_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({erro: "Time não encontrado!"});
        }

        res.status(200).json ({mensagem: "Time excluído com sucesso!", time_id});
    }
    catch (e) {
        res.status(500).json({erro: "Falha ao excluir time"});
    }
})