import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { pool } from "./db.js";
import bcrypt from "bcrypt";



dotenv.config();

const app = express()

app.post("/", async (req, res) => {
  try {
    const { nome, email, cargo, senha, time_id ,data_criacao } = req.body;

    const senha_hash = await bcrypt.hash(senha, 10);
    
    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, cargo, senha_hash, time_id ,data_criacao) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, email, cargo, senha_hash, time_id ,data_criacao]
    );

    res.status(201).json({ id: result, nome, email });
  } 
  catch (e) {
    res.status(500).json({ erro: "Falha ao criar usuário" });
  }
});


/*já avisando pos caba do login,
caso tu nn conheça o bcrypt e queira logar, tu faz o seguinte:

const senhaCorreta = await bcrypt.compare(
    senhaDigitada,
    senha_hashDoBanco
);

*/