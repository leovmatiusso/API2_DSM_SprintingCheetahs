import "dotenv/config";
import { enviarSenhaAlterada } from "./notificacoesEmail.js";

enviarSenhaAlterada({
  nome: "Kelwin",
  email: "teste@exemplo.com",
  dataHora: new Date(),
})
  .then((info) => console.log("Enviado:", info.messageId))
  .catch((err) => console.error("Erro:", err));