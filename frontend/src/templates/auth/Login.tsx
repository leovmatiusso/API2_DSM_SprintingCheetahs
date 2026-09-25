import "@/style/Login.css";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api";
import { saveSession } from "@/auth";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/PasswordInput";

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
            textSize="lg"
          />

          <PasswordInput
            id="senha"
            label="Senha"
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Digite sua senha"
            required
            variant="pill"
            textSize="lg"
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

            <span className="text-xl">Se clicar nos emails loga 🙂</span>

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
