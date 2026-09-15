import "../style/Login.css";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { saveSession } from "../auth";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await login(email, password);
      saveSession(result);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login.");
    } finally { setLoading(false); }
  }

  return (
  <main className="flex min-h-screen">
    
    {/* LADO DO LOGIN */}
    <section className="w-1/2 flex items-center justify-center p-10">
      <form className="login-card" onSubmit={handleSubmit}>
        
        <h1 className="text-4xl font-bold text-blue-600">Entrar</h1>

        <p className="muted">
          Acesse sua conta para continuar.
        </p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
            required
          />
        </label>

        <PasswordInput
          label="Senha"
          value={password}
          onChange={setPassword}
          placeholder="Digite sua senha"
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="test-users">
          <strong>Contas para teste — senha: 123456</strong>
          <span>admin@empresa.com — Superusuário</span>
          <span>gestor@empresa.com — Gestor</span>
          <span>comercial@empresa.com — Comercial</span>
          <span>suporte@empresa.com — Suporte</span>
          <span>producao@empresa.com — Produção</span>
          <span>software@empresa.com — Software</span>
          <span>implantacao@empresa.com — Implantação</span>
        </div>

      </form>
    </section>

    {/* LADO DA IMAGEM */}
    <section className="w-1/2">
      <img
        src="../../img/fundo_login.png"
        alt="Imagem da empresa"
        className="w-full h-full object-cover"
      />
    </section>

  </main>
);
}
