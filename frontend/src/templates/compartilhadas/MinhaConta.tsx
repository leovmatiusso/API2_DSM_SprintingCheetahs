import "@/style/MinhaConta.css";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getAccount } from "@/api";
import { getCurrentUser } from "@/auth";
import PasswordInput from "@/components/PasswordInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const roleLabels: Record<string, string> = {
  superusuario: "superusuario",
  gestor: "gestor",
  comercial: "comercial",
  suporte: "suporte",
  producao: "producao",
  software: "software",
  implantacao: "implantacao",
};

export default function MinhaConta() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [name, setName] = useState(currentUser?.name ?? "");
  const [role, setRole] = useState(currentUser?.role ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccount()
      .then((data) => {
        setEmail(data.user.email);
        setName(data.user.name);
        setRole(data.user.role);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro."));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("A nova senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("A nova senha precisa ser diferente da atual.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja atualizar sua senha?")) {
      return;
    }

    setLoading(true);

    try {
      await changePassword(currentPassword, newPassword);

      setMessage("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <strong>Minha conta</strong>

        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </header>

      <section className="card content account-card flex flex-col gap-5">
        <h1>Minha conta</h1>

        <Input label="Nome" value={name} readOnly />

        <Input label="Email" value={email} readOnly />

        <Input label="Perfil" value={roleLabels[role] ?? role} readOnly />

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <PasswordInput
              label="Senha atual"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Digite a senha atual"
              required
            />

            <PasswordInput
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Digite a nova senha"
              required
            />
          </div>

          {message && <div className="success">{message}</div>}

          {error && <div className="error">{error}</div>}

          <div className="mt-5">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Confirmar alteração"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
