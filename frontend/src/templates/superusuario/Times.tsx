import "@/style/Usuarios.css";
import "@/style/Times.css";

import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ClipboardList,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  UsersRound,
  SquarePen,
  Trash,
} from "lucide-react";

import { deleteTime, getTimes, getUsers, updateTime } from "@/api";
import { getCurrentUser } from "@/auth";
import type { Role, Time, User } from "@/types";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const equipes: {
  value: Role;
  label: string;
}[] = [
  { value: "gestor", label: "Gestor" },
  { value: "comercial", label: "Comercial" },
  { value: "suporte", label: "Suporte" },
  { value: "producao", label: "Produção" },
  { value: "software", label: "Software" },
  { value: "implantacao", label: "Implantação" },
];

export default function Times() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const isAllowed =
    currentUser?.role === "superusuario" || currentUser?.role === "gestor";
  const isSuperusuario = currentUser?.role === "superusuario";

  const [times, setTimes] = useState<Time[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editing, setEditing] = useState<Time | null>(null);
  const [timeToDelete, setTimeToDelete] = useState<Time | null>(null);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [nomeTime, setNomeTime] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [pessoasVinculadas, setPessoasVinculadas] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [timesResult, usersResult] = await Promise.all([
        getTimes(),
        getUsers(),
      ]);

      setTimes(timesResult.times);
      setUsers(usersResult.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar times.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAllowed) {
      load();
    }
  }, [isAllowed]);

  if (!currentUser || !isAllowed) {
    return null;
  }

  function abrirEdicao(time: Time) {
    setEditing(time);
    setNomeTime(time.nome_time);
    setDepartamento(time.departamento);
    setResponsavelId(time.responsavel_id ?? "");
    setPessoasVinculadas(time.pessoasVinculadas.map((user) => user.id));
    setError("");
    setMessage("");
    setOpenMenu(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditing(null);
    setNomeTime("");
    setDepartamento("");
    setResponsavelId("");
    setPessoasVinculadas([]);
  }

  function adicionarPessoa(id: string) {
    if (!id || pessoasVinculadas.includes(id)) return;
    setPessoasVinculadas([...pessoasVinculadas, id]);
  }

  function removerPessoa(id: string) {
    setPessoasVinculadas(pessoasVinculadas.filter((item) => item !== id));
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;

    setError("");
    setMessage("");

    try {
      await updateTime(editing.id, {
        nome_time: nomeTime.trim(),
        departamento,
        responsavel_id: responsavelId || null,
        usuarios_ids: pessoasVinculadas,
      });

      cancelarEdicao();
      setMessage("Time atualizado com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar time.");
    }
  }

  async function confirmarExclusao() {
    if (!timeToDelete) return;

    try {
      await deleteTime(timeToDelete.id);
      setTimeToDelete(null);
      setSelectedTimes((current) =>
        current.filter((id) => id !== timeToDelete.id),
      );
      setMessage("Time excluído com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir time.");
    }
  }

  function getEquipeLabel(value: string) {
    return equipes.find((item) => item.value === value)?.label ?? value;
  }

  function getInitials(name: string) {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  const filteredTimes = times.filter((time) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      time.nome_time.toLowerCase().includes(query) ||
      getEquipeLabel(time.departamento).toLowerCase().includes(query) ||
      time.responsavel?.name.toLowerCase().includes(query) ||
      time.pessoasVinculadas.some((person) =>
        person.name.toLowerCase().includes(query),
      );

    const matchesDepartment =
      !departmentFilter || time.departamento === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  function toggleSelected(timeId: string) {
    setSelectedTimes((current) =>
      current.includes(timeId)
        ? current.filter((id) => id !== timeId)
        : [...current, timeId],
    );
  }

  function toggleAllVisible() {
    const visibleIds = filteredTimes.map((time) => time.id);
    const allVisibleSelected = visibleIds.every((id) =>
      selectedTimes.includes(id),
    );

    setSelectedTimes((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  }

  const allVisibleSelected =
    filteredTimes.length > 0 &&
    filteredTimes.every((time) => selectedTimes.includes(time.id));

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* Cabeçalho */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <UsersRound size={32} />
            </div>

            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
                Times
              </h1>
              <p className="text-text-muted m-0 text-sm md:text-base">
                Gerencie as equipes e seus integrantes.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => navigate("/cadastro-times")}
          >
            <span className="flex items-center gap-2">
              <Plus size={19} />
              Novo time
            </span>
          </Button>
        </header>

        {message && <div className="success content mb-4">{message}</div>}
        {error && <div className="error content mb-4">{error}</div>}

        {/* Formulário de edição */}
        {editing && (
          <section className="card content mb-6">
            <h2 className="text-text mb-5 text-xl font-bold">Editar time</h2>

            <form
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
              onSubmit={salvarEdicao}
            >
              <Input
                label="Nome do time"
                value={nomeTime}
                onChange={(e) => setNomeTime(e.target.value)}
                required
              />

              <Select
                label="Equipe relacionada"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                required
              >
                <option value="">Selecione uma equipe</option>
                {equipes.map((equipe) => (
                  <option key={equipe.value} value={equipe.value}>
                    {equipe.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Pessoa responsável"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </Select>

              <Select
                label="Pessoas vinculadas"
                value=""
                onChange={(e) => adicionarPessoa(e.target.value)}
              >
                <option value="">Adicionar usuário</option>
                {users
                  .filter((user) => !pessoasVinculadas.includes(user.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </Select>

              <div className="flex flex-wrap gap-2 md:col-span-2">
                {pessoasVinculadas.map((id) => {
                  const user = users.find((item) => item.id === id);
                  if (!user) return null;

                  return (
                    <span
                      key={id}
                      className="bg-primary-muted text-primary flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                    >
                      {user.name}
                      <button
                        type="button"
                        onClick={() => removerPessoa(id)}
                        aria-label={`Remover ${user.name}`}
                        className="font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>

              <div className="nav-actions md:col-span-2">
                <Button type="submit" variant="primary">
                  Salvar alterações
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelarEdicao}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Listagem */}
        <section className="nova-os-card border-border min-h-[620px] w-full rounded-2xl border p-5 shadow-sm md:p-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-[70%]">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome do time, responsável ou integrante"
                iconLeft={Search}
                aria-label="Buscar times"
              />
            </div>

            <div className="w-full md:max-w-[300px]">
              <Select
                label=""
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">Selecione uma equipe</option>
                {equipes.map((equipe) => (
                  <option key={equipe.value} value={equipe.value}>
                    {equipe.label}
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
            {selectedTimes.length} Selecionados
          </button>

          {loading ? (
            <p className="text-text-muted px-5 py-4">Carregando times...</p>
          ) : filteredTimes.length === 0 ? (
            <p className="text-text-muted px-5 py-4">
              {times.length === 0
                ? "Nenhum time cadastrado."
                : "Nenhum time encontrado."}
            </p>
          ) : (
            <div className="divide-border divide-y">
              {filteredTimes.map((time) => {
                const selected = selectedTimes.includes(time.id);

                return (
                  <div
                    key={time.id}
                    className="grid grid-cols-[28px_40px_minmax(0,1fr)_36px] items-center gap-3 border-border px-3 py-4 sm:grid-cols-[28px_40px_minmax(130px,1.1fr)_minmax(120px,1fr)_minmax(150px,1.2fr)_minmax(110px,0.8fr)_36px] sm:gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelected(time.id)}
                      aria-label={
                        selected
                          ? `Desmarcar ${time.nome_time}`
                          : `Selecionar ${time.nome_time}`
                      }
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-bg"
                      }`}
                    >
                      {selected && <Check size={13} />}
                    </button>

                    <div className="bg-primary-muted text-primary flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold">
                      {getInitials(time.nome_time)}
                    </div>

                    <div className="min-w-0">
                      <span className="text-text block truncate text-sm font-semibold">
                        {time.nome_time}
                      </span>
                      <span className="text-text-muted block text-xs sm:hidden">
                        {getEquipeLabel(time.departamento)}
                      </span>
                    </div>

                    <span className="text-text-muted hidden truncate text-sm sm:block">
                      {time.responsavel?.name ?? "Não definido"}
                    </span>

                    <div className="hidden min-w-0 flex-wrap gap-1.5 sm:flex">
                      {time.pessoasVinculadas.length === 0 ? (
                        <span className="text-text-muted text-sm">Nenhuma</span>
                      ) : (
                        <>
                          {time.pessoasVinculadas.slice(0, 2).map((person) => (
                            <span
                              key={person.id}
                              className="bg-primary-muted text-text-muted max-w-full truncate rounded-full px-2.5 py-1 text-xs"
                            >
                              {person.name}
                            </span>
                          ))}
                          {time.pessoasVinculadas.length > 2 && (
                            <span className="text-text-muted self-center text-xs">
                              +{time.pessoasVinculadas.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <span className="bg-primary-muted text-text-muted hidden w-fit items-center gap-2 rounded-full px-3 py-1 text-xs sm:flex">
                      <ClipboardList size={13} />
                      {getEquipeLabel(time.departamento)}
                    </span>

                    <div className="relative justify-self-end">
                      <button
                        type="button"
                        aria-label={`Ações para ${time.nome_time}`}
                        onClick={() =>
                          setOpenMenu(openMenu === time.id ? null : time.id)
                        }
                        className="text-text-muted hover:text-primary rounded p-1"
                      >
                        <MoreHorizontal size={21} />
                      </button>

                      {openMenu === time.id && (
                        <div className="nova-os-card border-border absolute top-full right-0 z-20 mt-1 min-w-36 rounded-lg border p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(time)}
                            className="text-text hover:bg-bg-tertiary flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm"
                          >
                            <SquarePen size={16} />
                            Editar
                          </button>

                          {isSuperusuario && (
                            <button
                              type="button"
                              onClick={() => {
                                setTimeToDelete(time);
                                setOpenMenu(null);
                              }}
                              className="text-danger hover:bg-bg-tertiary flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm items-center gap-2"
                            >
                              <Trash size={16} />
                              Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Confirmação de exclusão */}
      {timeToDelete && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h2>Excluir time</h2>
            <p>
              Deseja excluir o time{" "}
              <strong>{timeToDelete.nome_time}</strong>?
            </p>

            <div className="delete-actions">
              <button
                type="button"
                className="delete-confirm"
                onClick={confirmarExclusao}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="delete-cancel"
                onClick={() => setTimeToDelete(null)}
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