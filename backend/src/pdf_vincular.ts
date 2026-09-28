import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express()

app.post("/", async (req, res) => {
  try {
    const { os_id, nome_anexo, anexo_tipo, anexo_tamanho ,data_anexo } = req.body;
    
    const [result] = await pool.query(
      "INSERT INTO anexo (os_id, nome_anexo, anexo_tipo, anexo_tamanho ,data_anexo) VALUES (?, ?, ?, ?, ?)",
      [os_id, nome_anexo, anexo_tipo, anexo_tamanho ,data_anexo]
    );

    res.status(201).json({ id: result, os_id, nome_anexo });
  } 
  catch (e) {
    res.status(500).json({ erro: "Falha ao vincular arquiva à OS" });
  }
});