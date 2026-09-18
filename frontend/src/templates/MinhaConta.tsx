import "../style/MinhaConta.css";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, getAccount } from "../api";
import { getCurrentUser } from "../auth";
import PasswordInput from "@/components/PasswordInput";
import Button from "@/components/ui/Button";

export default function MinhaConta() {
  const navigate = useNavigate(); const currentUser = getCurrentUser();
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [name, setName] = useState(currentUser?.name ?? "");
  const [role, setRole] = useState(currentUser?.role ?? "");
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => { getAccount().then(data => { setEmail(data.user.email); setName(data.user.name); setRole(data.user.role); }).catch(err => setError(err instanceof Error ? err.message : "Erro.")); }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setMessage(""); setError("");
    if (newPassword.length < 6) return setError("A nova senha deve possuir pelo menos 6 caracteres.");
    if (currentPassword === newPassword) return setError("A nova senha precisa ser diferente da atual.");
    if (!window.confirm("Tem certeza que deseja atualizar sua senha?")) return;
    setLoading(true);
    try { await changePassword(currentPassword, newPassword); setMessage("Senha atualizada com sucesso!"); setCurrentPassword(""); setNewPassword(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Erro ao atualizar."); } finally { setLoading(false); }
  }

  return <main className="page"><header className="topbar"><strong>Minha conta</strong>
    <Button variant="secondary" onClick={() => navigate("/dashboard")}>
      Voltar
    </Button>
    </header>
    <section className="card content account-card"><h1>Minha conta</h1><label>Nome<input value={name} readOnly /></label><label>Email<input value={email} readOnly /></label><label>Perfil<input value={role} readOnly /></label>
      <form onSubmit={handleSubmit}><PasswordInput label="Senha atual" value={currentPassword} onChange={setCurrentPassword} placeholder="Digite a senha atual" /><PasswordInput label="Nova senha" value={newPassword} onChange={setNewPassword} placeholder="Digite a nova senha" />{message && <div className="success">{message}</div>}{error && <div className="error">{error}</div>}
      <Button variant="primary" type="submit" disabled={loading}>
        {loading ? "Atualizando..." : "Confirmar alteração"}
        </Button></form>

    </section></main>;
}
