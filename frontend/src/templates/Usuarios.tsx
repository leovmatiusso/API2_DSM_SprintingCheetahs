import "../style/Usuarios.css";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser
} from "../api";
import { getCurrentUser } from "../auth";
import type { Role, User } from "../types";
import Button from "@/components/ui/Button";

const roles: {
  value: Role;
  label: string;
}[] = [
  ["superusuario", "Superusuário"],
  ["gestor", "Gestor"],
  ["comercial", "Comercial"],
  ["suporte", "Suporte"],
  ["producao", "Produção"],
  ["software", "Software"],
  ["implantacao", "Implantação"]
].map(([value, label]) => ({
  value: value as Role,
  label: label as string
}));

export default function Usuarios() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const isSuperusuario =
    currentUser?.role === "superusuario";

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "123456",
    role: "comercial" as Role
  });

  const [editing, setEditing] =
    useState<string | null>(null);

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await getUsers();

      setUsers(result.users);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao carregar usuários."
      );
    } finally {
      setLoading(false);
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
      role: "comercial"
    });
  }

  async function submit(
    e: FormEvent
  ) {
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
              role: form.role
            };

        await updateUser(
          editing,
          data
        );

        setMessage(
          "Usuário atualizado com sucesso."
        );
      } else {
        await createUser(form);

        setMessage(
          "Usuário cadastrado com sucesso."
        );
      }

      reset();

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar usuário."
      );
    }
  }

  function edit(user: User) {
    if (!isSuperusuario) {
      return;
    }

    setEditing(user.id);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function toggleUser(
    user: User
  ) {
    if (!isSuperusuario) {
      return;
    }

    try {
      await updateUser(
        user.id,
        {
          active: !user.active
        }
      );

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao atualizar usuário."
      );
    }
  }

  async function confirmDelete() {
    if (!userToDelete) {
      return;
    }

    try {
      await deleteUser(
        userToDelete.id
      );

      setUserToDelete(null);

      setMessage(
        "Usuário excluído com sucesso."
      );

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erro ao excluir usuário."
      );
    }
  }

  function getRoleLabel(
    role: Role
  ) {
    return (
      roles.find(
        item => item.value === role
      )?.label ?? role
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <strong>
          Gerenciamento de usuários
        </strong>

        <Button
          variant="secondary"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Voltar
        </Button>
      </header>

      <section className="card content">
        <h1>
          {editing
            ? "Editar usuário"
            : "Novo usuário"}
        </h1>

        <form
          className="user-form"
          onSubmit={submit}
        >
          <label>
            Nome

            <input
              value={form.name}
              onChange={e =>
                setForm({
                  ...form,
                  name: e.target.value
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
              onChange={e =>
                setForm({
                  ...form,
                  email: e.target.value
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
              onChange={e =>
                setForm({
                  ...form,
                  password: e.target.value
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
              onChange={e =>
                setForm({
                  ...form,
                  role:
                    e.target.value as Role
                })
              }
            >
              {roles.map(role => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <div className="nav-actions">
            <Button
              variant="primary"
              type="submit"
            >
              {editing
                ? "Salvar alterações"
                : "Criar usuário"}
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

        {message && (
          <div className="success">
            {message}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </section>

      <section className="card content">
        <h2>
          Usuários cadastrados
        </h2>

        {loading ? (
          <p>
            Carregando usuários...
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>

                  {isSuperusuario && (
                    <th>Ações</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        isSuperusuario
                          ? 5
                          : 4
                      }
                    >
                      Nenhum usuário cadastrado.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>
                        {user.name}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>
                        {getRoleLabel(
                          user.role
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            user.active
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {user.active
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </td>

                      {isSuperusuario && (
                        <td>
                          <div className="nav-actions">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                edit(user)
                              }
                            >
                              Editar
                            </Button>

                            {user.role !==
                              "superusuario" && (
                              <>
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    toggleUser(
                                      user
                                    )
                                  }
                                >
                                  {user.active
                                    ? "Desativar"
                                    : "Ativar"}
                                </Button>

                                <Button
                                  variant="danger"
                                  onClick={() =>
                                    setUserToDelete(
                                      user
                                    )
                                  }
                                >
                                  Excluir
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {userToDelete && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h2>
              Excluir usuário
            </h2>

            <p>
              Deseja excluir usuário{" "}
              <strong>
                {userToDelete.email}
              </strong>{" "}
              na função de{" "}
              <strong>
                {getRoleLabel(
                  userToDelete.role
                )}
              </strong>?
            </p>

            <div className="delete-actions">
              <button
                type="button"
                className="delete-confirm"
                onClick={confirmDelete}
              >
                Confirmar
              </button>

              <button
                type="button"
                className="delete-cancel"
                onClick={() =>
                  setUserToDelete(null)
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}