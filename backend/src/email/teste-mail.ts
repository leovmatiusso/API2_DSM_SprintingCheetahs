import "dotenv/config";
import { transporter } from "./mailer.js";

transporter
  .verify()
  .then(() => console.log("Conexão SMTP OK"))
  .catch((err) => console.error("Erro SMTP:", err));