import { FormEvent, useEffect, useState } from "react";
import {
  ClipboardList,
  MoreHorizontal,
  Plus,
  UserRound,
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
import { Card } from "@/components/ui/Card";
import Cadastro from "../compartilhadas/Cadastro";
import { Main, Content, Header } from "../compartilhadas/Base";
import Checkbox from "@/components/ui/Checkbox";
import SearchFilter from "@/components/ui/SearchFilter";
import DropdownMenu from "@/components/ui/DropdownMenu";
import EditButton from "@/components/ui/EditMenu";
import EditModal from "@/components/ui/EditModal";
import useSelecao from "@/hooks/useSelecao";
import getInitials from "@/utils/getInitials";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  { value: "monitoramento", label: "Monitoramento" },
];

export default function Usuarios() {
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

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
      prune(result.users.map((u) => u.id));
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

    setMessage("");
    setError("");

    try {
      await updateUser(user.id, { active: !user.active });
      setOpenMenu(null);
      setMessage(user.active ? "Usuário desativado com sucesso." : "Usuário ativado com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar usuário.");
    }
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    setMessage("");
    setError("");
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setMessage("Usuário excluído com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir usuário.");
    }
  }

  function getRoleLabel(role: Role) {
    return roles.find((item) => item.value === role)?.label ?? role;
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

  const { selectedIds, toggleSelected, toggleAllVisible, allSelected, prune } =
    useSelecao(filteredUsers);

  if (mostrarCadastro) {
    return (
      <Cadastro
        onVoltar={() => setMostrarCadastro(false)}
        onCadastrado={async () => {
          setMostrarCadastro(false);
          await load();
        }}
      />
    );
  }

  return (
    <Main>
      {/* Formulário de edição */}
      <EditModal isOpen={!!editing} title="Editar usuário">
        <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={submit}>
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Input
            type="email"
            label="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <Input
            type="password"
            label="Nova senha"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Deixe vazio para manter"
          />

          <Select
            label="Perfil"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>

          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" variant="primary">
              Salvar alterações
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </form>
      </EditModal>
      <Content>
        {/* Cabeçalho */}
        <Header
          icon={UserRound}
          title="Usuários"
          subtitle="Gerencie os acessos e permissões da sua equipe."
        >
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => setMostrarCadastro(true)}
          >
            <span className="flex items-center gap-2">
              <Plus size={19} />
              <span className="hidden @3xl:block">Novo usuário</span>
            </span>
          </Button>
        </Header>

        {message && <FeedbackMessage message={message} type="success" />}
        {error && <FeedbackMessage message={error} type="error" />}

        {/* Listagem */}
        <Card className="min-h-[620px]">
          <SearchFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por nome, e-mail ou papel"
            searchLabel="Buscar usuários por nome, e-mail ou papel"
            filter={roleFilter}
            onFilterChange={setRoleFilter}
            filterOptions={roles}
            filterPlaceholder="Selecione um cargo"
          />

          <button
            type="button"
            onClick={toggleAllVisible}
            aria-pressed={allSelected}
            className="bg-primary-muted text-text mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-3 text-left text-xs font-semibold @3xl:px-5 @3xl:py-3 @3xl:text-sm"
          >
            <Checkbox checked={allSelected} />
            {selectedIds.length} Selecionados
          </button>

          {loading ? (
            <p className="text-text-muted px-5 py-4">Carregando usuários...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-text-muted px-5 py-4">
              {users.length === 0 ? "Nenhum usuário cadastrado." : "Nenhum usuário encontrado."}
            </p>
          ) : (
            <div className="divide-border divide-y">
              {filteredUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-[28px_40px_minmax(0,1fr)_36px] items-center gap-3 px-3 py-3 @3xl:grid-cols-[28px_40px_minmax(80px,1.1fr)_minmax(120px,0.8fr)_36px] @3xl:gap-4 @6xl:grid-cols-[28px_40px_minmax(150px,1.1fr)_minmax(170px,1.2fr)_minmax(120px,0.8fr)_36px]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelected(user.id)}
                      aria-label={isSelected ? `Desmarcar ${user.name}` : `Selecionar ${user.name}`}
                      aria-pressed={isSelected}
                      className="flex size-4 cursor-pointer items-center justify-center"
                    >
                      <Checkbox checked={isSelected} />
                    </button>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${user.active ? "bg-primary-muted text-primary" : "bg-primary-muted/50 text-primary/50"}`}
                    >
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0">
                      <span
                        className={`block truncate text-sm font-semibold ${user.active ? "text-text" : "text-text-muted line-through"}`}
                      >
                        {user.name}
                      </span>
                      <span className="text-text-muted block truncate text-xs @6xl:hidden">
                        {user.email}
                      </span>
                      <span className="text-text-muted block text-xs @3xl:hidden">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <span
                      className={`hidden truncate text-sm font-semibold @6xl:block ${user.active ? "text-text-muted" : "text-text-muted/50"}`}
                    >
                      {user.email}
                    </span>

                    <span className="bg-primary-muted text-text-muted hidden w-fit items-center gap-2 place-self-center rounded-full @3xl:flex
                    px-2.5 py-0.75 text-xs @[1320px]:gap-2 @[1320px]:px-3 @[1320px]:py-1 @[1320px]:text-sm">
                      <ClipboardList className="size-3 @[1320px]:size-3.5" />
                      {getRoleLabel(user.role)}
                    </span>

                    {isSuperusuario && (
                      <div className="relative justify-self-end">
                        <button
                          type="button"
                          aria-label={`Ações para ${user.name}`}
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="text-text-muted hover:text-primary rounded p-1"
                        >
                          <MoreHorizontal size={21} />
                        </button>

                        {openMenu === user.id && (
                          <DropdownMenu>
                            <EditButton
                              type="button"
                              onClick={() => edit(user)}
                              text="Editar"
                              icon={SquarePen}
                            />
                            {user.role !== "superusuario" && (
                              <>
                                <EditButton
                                  type="button"
                                  onClick={() => toggleUser(user)}
                                  text={user.active ? "Desativar" : "Ativar"}
                                  icon={user.active ? PowerOff : Power}
                                />
                                <EditButton
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setOpenMenu(null);
                                  }}
                                  variant="danger"
                                  text="Excluir"
                                  icon={Trash}
                                />
                              </>
                            )}
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Content>

      {/* Confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Excluir usuário"
        description={
          <>
            Deseja excluir o usuário{" "}
            <strong className="text-text font-semibold">{userToDelete?.email}</strong> na função de{" "}
            <strong className="text-text font-semibold">
              {userToDelete && getRoleLabel(userToDelete.role)}
            </strong>
            ?
          </>
        }
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
      />
    </Main>
  );
}
