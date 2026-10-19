import "@/style/Login.css";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api";
import { saveSession } from "@/auth";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/PasswordInput";

import { toast } from 'sonner';

export function showNotificationToast() {
  toast.custom((t) => (
    <div className="flex items-center gap-3 w-full max-w-sm bg-slate-100/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-xl p-4 text-slate-800 pointer-events-auto">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">Nova OS atribuída a você</p>
        <p className="text-xs text-slate-600 truncate mt-0.5">OS criada por Manoel Gomes do time Suporte</p>
        <p className="text-[10px] text-slate-400 mt-1">12h atrás</p>
      </div>
    </div>
  ));
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      saveSession(result);

      if (result.user.role === "gestor") {
        navigate("/dashboard/gestor", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login.");
    } finally {
      setLoading(false);
    }
  }

  // dev function

  async function submitLogin(nextEmail: string, nextPassword: string) {
    setError("");
    setLoading(true);

    try {
      const result = await login(nextEmail, nextPassword);
      saveSession(result);

      if (result.user.role === "gestor") {
        navigate("/dashboard/gestor", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no login.");
    } finally {
      setLoading(false);
    }
  }

  const logarRapido = (nextEmail: string) => {
    const nextPassword = "123456";
    setEmail(nextEmail);
    setPassword(nextPassword);
    void submitLogin(nextEmail, nextPassword);
  };

  return (
    <main className="login-page">
      <section className="login-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <h1 className="text-4xl font-bold">Entrar</h1>

          <p className="login-muted mb-5">Acesse sua conta para continuar.</p>

          <div className="flex flex-col gap-5 mb-5">
            <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
            required
            variant="pill"
          />

          <PasswordInput
            id="senha"
            label="Senha"
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Digite sua senha"
            required
            variant="pill"
          />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="test-users">
            <strong>
              <span className="select-none">Contas para teste — senha: </span>
              123456
            </strong>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("admin@empresa.com");
              }}
            >
              admin@empresa.com
              <span className="select-none">— Superusuário</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("gestor@empresa.com");
              }}
            >
              gestor@empresa.com
              <span className="select-none">— Gestor</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("comercial@empresa.com");
              }}
            >
              comercial@empresa.com
              <span className="select-none">— Comercial</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("suporte@empresa.com");
              }}
            >
              suporte@empresa.com
              <span className="select-none">— Suporte</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("producao@empresa.com");
              }}
            >
              producao@empresa.com
              <span className="select-none">— Produção</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("software@empresa.com");
              }}
            >
              software@empresa.com
              <span className="select-none">— Software</span>
            </span>

            <span
              className="cursor-pointer underline underline-offset-1 hover:font-semibold"
              onClick={(e) => {
                logarRapido("implantacao@empresa.com");
              }}
            >
              implantacao@empresa.com
              <span className="select-none">— Implantação</span>
            </span>
          </div>
        </form>
      </section>

      <section className="login-image">
        <img src="../../img/fundo_login.png" alt="Imagem da empresa" />
      </section>
    </main>
    
  );
}
