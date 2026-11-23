import "@/style/MinhaConta.css";
import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { changePassword, getAccount } from "@/api";
import { getCurrentUser } from "@/auth";
import PasswordInput from "@/components/PasswordInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const roleLabels: Record<string, string> = {
  superusuario: "superusuario",
  gestor: "gestor",
  comercial: "comercial",
  suporte: "suporte",
  producao: "producao",
  software: "software",
  implantacao: "implantacao",
  monitoramento: "monitoramento",
};

interface MinhaContaProps {
  modal?: boolean;
  onClose?: () => void;
}

export default function MinhaConta({ modal = false, onClose }: MinhaContaProps) {
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

  useEffect(() => {
    if (!modal || !onClose) return;
    const fechar = onClose;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") fechar();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, onClose]);

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

  const content = (
      <Card className={`account-card flex flex-col gap-5 ${modal ? "w-full max-w-[650px]" : "content"}`}>
        {modal ? (
          <div className="flex items-center justify-between">
            <h1 id="account-modal-title">Minha conta</h1>
            <button type="button" aria-label="Fechar" onClick={onClose} className="text-text-muted hover:text-text cursor-pointer rounded-lg p-1">
              <X size={20} />
            </button>
          </div>
        ) : <h1>Minha conta</h1>}

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
      </Card>
  );

  if (modal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="account-modal-title" className="w-full max-w-[650px]" onMouseDown={(event) => event.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return <main className="page">{content}</main>;
}
