import "@/style/Usuarios.css";

import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ClipboardList,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  UsersRound,
  Wrench,
  Trash,
  Power,
  PowerOff,
  SquarePen,
} from "lucide-react";

import { deleteUser, getUsers, updateUser } from "@/api";
import { getCurrentUser } from "@/auth";
import type { Role, User } from "@/types";

import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const roles: {
  value: Role;
  label: string;
}[] = [
  { value: "superusuario", label: "Superusuário" },
  { value: "gestor", label: "Gestor" },
  { value: "comercial", label: "Comercial" },
  { value: "suporte", label: "Suporte" },
  { value: "producao", label: "Produção" },
  { value: "software", label: "Software" },
  { value: "implantacao", label: "Implantação" },
];

export default function Usuarios() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isSuperusuario = currentUser?.role === "superusuario";

  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "comercial" as Role,
  });

  async function load() {
    setLoading(true);
    setError("");

    try {
      const result = await getUsers();
      setUsers(result.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
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
      password: "",
      role: "comercial",
    });
  }

  function edit(user: User) {
    if (!isSuperusuario) return;

    setEditing(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setOpenMenu(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;

    setError("");
    setMessage("");

    try {
      const data = form.password
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          }
        : {
            name: form.name,
            email: form.email,
            role: form.role,
          };

      await updateUser(editing, data);
      setMessage("Usuário atualizado com sucesso.");
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar usuário.");
    }
  }

  async function toggleUser(user: User) {
    if (!isSuperusuario) return;

    try {
      await updateUser(user.id, { active: !user.active });
      setOpenMenu(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar usuário.");
    }
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setMessage("Usuário excluído com sucesso.");
      setSelectedUsers((current) =>
        current.filter((id) => id !== userToDelete.id),
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir usuário.");
    }
  }

  function getRoleLabel(role: Role) {
    return roles.find((item) => item.value === role)?.label ?? role;
  }

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      getRoleLabel(user.role).toLowerCase().includes(query);

    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  function toggleSelected(userId: string) {
    setSelectedUsers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function toggleAllVisible() {
    const visibleIds = filteredUsers.map((user) => user.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedUsers.includes(id),
    );

    setSelectedUsers((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  }

  const allVisibleSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUsers.includes(user.id));

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* Cabeçalho */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <UserRound size={32} />
            </div>

            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
                Usuários
              </h1>
              <p className="text-text-muted m-0 text-sm md:text-base">
                Gerencie os acessos e permissões da sua equipe.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate("/cadastro")}
          >
            <span className="flex items-center gap-2">
              <Plus size={19} />
              Novo usuário
            </span>
          </Button>
        </header>

        {message && <div className="success content mb-4">{message}</div>}
        {error && <div className="error content mb-4">{error}</div>}

        {/* Formulário de edição */}
        {editing && (
          <section className="card content mb-6">
            <h2 className="text-text mb-5 text-xl font-bold">Editar usuário</h2>

            <form
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
              onSubmit={submit}
            >
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <Input
                type="email"
                label="E-mail"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />

              <Input
                type="password"
                label="Nova senha"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Deixe vazio para manter"
              />

              <Select
                label="Perfil"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as Role })
                }
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>

              <div className="nav-actions md:col-span-2">
                <Button type="submit" variant="primary">
                  Salvar alterações
                </Button>
                <Button type="button" variant="secondary" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Listagem */}
        <section className="card content min-h-[620px] rounded-2xl border border-border p-5 md:p-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-[70%]">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou papel"
                iconLeft={Search}
                aria-label="Buscar usuários por nome, e-mail ou papel"
              />
            </div>

            <div className="w-full md:max-w-[300px]">
              <Select
                label=""
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Selecione um cargo</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleAllVisible}
            className="bg-primary-muted text-text mb-2 flex min-h-12 w-full items-center gap-3 rounded-lg px-5 text-left text-sm font-semibold"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                allVisibleSelected
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg"
              }`}
            >
              {allVisibleSelected && <Check size={13} />}
            </span>
            {selectedUsers.length} Selecionados
          </button>

          {loading ? (
            <p className="text-text-muted px-5 py-4">Carregando usuários...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-text-muted px-5 py-4">
              {users.length === 0
                ? "Nenhum usuário cadastrado."
                : "Nenhum usuário encontrado."}
            </p>
          ) : (
            <div className="divide-border divide-y">
              {filteredUsers.map((user) => {
                const selected = selectedUsers.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[28px_40px_minmax(130px,1fr)] items-center gap-3 px-3 py-3 sm:grid-cols-[28px_40px_minmax(150px,1.1fr)_minmax(170px,1.2fr)_minmax(120px,0.8fr)_36px] sm:gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelected(user.id)}
                      aria-label={
                        selected
                          ? `Desmarcar ${user.name}`
                          : `Selecionar ${user.name}`
                      }
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-bg"
                      }`}
                    >
                      {selected && <Check size={13} />}
                    </button>

                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${user.active ? "bg-primary-muted text-primary" : "bg-primary-muted/50 text-primary/50"}`}>
                      {getInitials(user.name)}
                    </div>

                    <span className={`truncate text-sm font-semibold ${user.active ? "text-text" : "text-text-muted line-through"}`}>
                      {user.name}
                    </span>

                    <span className={`col-span-3 truncate text-sm font-semibold sm:col-span-1 ${user.active ? "text-text-muted" : "text-text-muted/50"}`}>
                      {user.email}
                    </span>

                    <span className="bg-primary-muted text-text-muted col-span-2 flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs sm:col-span-1">
                      <ClipboardList size={13} />
                      {getRoleLabel(user.role)}
                    </span>

                    {isSuperusuario && (
                      <div className="relative justify-self-end">
                        <button
                          type="button"
                          aria-label={`Ações para ${user.name}`}
                          onClick={() =>
                            setOpenMenu(openMenu === user.id ? null : user.id)
                          }
                          className="text-text-muted hover:text-primary rounded p-1"
                        >
                          <MoreHorizontal size={21} />
                        </button>

                        {openMenu === user.id && (
                          <div className="nova-os-card border-border absolute top-full right-0 z-20 mt-1 min-w-36 rounded-lg border p-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => edit(user)}
                              className="text-text hover:bg-bg-tertiary flex w-full rounded px-3 py-2 text-left text-sm items-center gap-2"
                            >
                              <SquarePen size={16} />
                              Editar
                            </button>
                            {user.role !== "superusuario" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleUser(user)}
                                  className="text-text hover:bg-bg-tertiary flex w-full rounded px-3 py-2 text-left text-sm items-center gap-2"
                                >
                                  <Power size={16} />
                                  {user.active ? "Desativar" : "Ativar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setOpenMenu(null);
                                  }}
                                  className="text-danger hover:bg-bg-tertiary flex w-full rounded px-3 py-2 text-left text-sm items-center gap-2"
                                >
                                  <Trash size={16} />
                                  Excluir
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Confirmação de exclusão */}
      {userToDelete && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h2>Excluir usuário</h2>

            <p>
              Deseja excluir usuário <strong>{userToDelete.email}</strong> na
              função de <strong>{getRoleLabel(userToDelete.role)}</strong>?
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
                onClick={() => setUserToDelete(null)}
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