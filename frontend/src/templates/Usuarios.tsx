import "../style/Usuarios.css";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, deleteUser, getUsers, updateUser } from "../api";
import type { Role, User } from "../types";
import Button from "@/components/ui/Button";

const roles: { value: Role; label: string }[] = [
  ["superusuario", "Superusuário"],
  ["gestor", "Gestor"],
  ["comercial", "Comercial"],
  ["suporte", "Suporte"],
  ["producao", "Produção"],
  ["software", "Software"],
  ["implantacao", "Implantação"],
].map(([value, label]) => ({
  value: value as Role,
  label: label as string,
}));

export default function Usuarios() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "123456",
    role: "comercial" as Role,
  });

  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    try {
      setUsers((await getUsers()).users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      password: "123456",
      role: "comercial",
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editing) {
        const data = form.password
          ? form
          : {
              name: form.name,
              email: form.email,
              role: form.role,
            };

        await updateUser(editing, data);
      } else {
        await createUser(form);
      }

      setMessage(editing ? "Usuário atualizado." : "Usuário criado.");
      reset();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar."
      );
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta conta?")) return;

    try {
      await deleteUser(id);
      await load();
      setMessage("Usuário excluído.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao excluir."
      );
    }
  }

  function edit(user: User) {
    setEditing(user.id);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="page">
      <header className="topbar">
        <strong>Gerenciamento de usuários</strong>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Voltar
            </Button>
      </header>

      <section className="card content">
        <h1>{editing ? "Editar usuário" : "Novo usuário"}</h1>

        <form className="user-form" onSubmit={submit}>
          <label>
            Nome
            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              placeholder={
                editing
                  ? "Deixe vazio para manter"
                  : "Mínimo 6 caracteres"
              }
              required={!editing}
            />
          </label>

          <label>
            Perfil
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as Role,
                })
              }
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="nav-actions">
            <Button variant="primary" type="submit">
              {editing ? "Salvar alterações" : "Criar usuário"}
            </Button>

            {editing && (
              <Button
                type="button"
                variant="secondary"
                onClick={reset}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      <section className="card content">
        <h2>Contas cadastradas</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>

                  <td>{user.email}</td>

                  <td>
                    {
                      roles.find(
                        (r) => r.value === user.role
                      )?.label
                    }
                  </td>

                  <td>
                    {user.active ? "Ativo" : "Inativo"}
                  </td>

                  <td>
                    <div className="nav-actions">
                      {/* Editar aparece para todos */}
                      <Button variant="secondary" onClick={() => edit(user)}>
                            Editar
                          </Button>

                      {/* Apenas usuários que NÃO são superusuários
                          podem ser ativados/desativados ou excluídos */}
                      {user.role !== "superusuario" && (
                        <>
                          <Button variant="secondary" onClick={() =>
                              updateUser(user.id, {
                                active: !user.active,
                              })
                                .then(load)
                                .catch((e) =>
                                  setError(
                                    e instanceof Error
                                      ? e.message
                                      : "Erro ao atualizar."
                                  )
                                )}>
                            {user.active
                              ? "Desativar"
                              : "Ativar"}
                          </Button>

                          <Button variant="danger" onClick={() => remove(user.id)}>
                              Excluir
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}