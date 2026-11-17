import { FormEvent, useEffect, useState } from "react";
import { ClipboardList, MoreHorizontal, Plus, UsersRound, SquarePen, Trash } from "lucide-react";

import { deleteTime, getTimes, getUsers, updateTime } from "@/api";
import { getCurrentUser } from "@/auth";
import type { Role, Time, User } from "@/types";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import EditButton from "@/components/ui/EditMenu";
import CadastroTimes from "../compartilhadas/CadastroTimes";
import { Main, Content, Header } from "../compartilhadas/Base";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackMessage from "@/components/ui/FeedbackMessage";
import Checkbox from "@/components/ui/Checkbox";
import useSelecao from "@/hooks/useSelecao";
import SearchFilter from "@/components/ui/SearchFilter";
import DropdownMenu from "@/components/ui/DropdownMenu";
import getInitials from "@/utils/getInitials";
import EditModal from "@/components/ui/EditModal";

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
  { value: "monitoramento", label: "Monitoramento" },
];

const equipesDeTime = equipes.filter(
  (equipe) => equipe.value !== "comercial" && equipe.value !== "suporte",
);

const NUM_PESSOAS_VINCULADAS = 4;

function getEquipeLabel(value: string) {
  return equipes.find((item) => item.value === value)?.label ?? value;
}

export default function Times() {
  const currentUser = getCurrentUser();

  const isAllowed = currentUser?.role === "superusuario" || currentUser?.role === "gestor";
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [nomeTime, setNomeTime] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [pessoasVinculadas, setPessoasVinculadas] = useState<string[]>([]);
  const [mostrarTime, setMostrarTime] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [timesResult, usersResult] = await Promise.all([getTimes(), getUsers()]);

      setTimes(timesResult.times);
      setUsers(usersResult.users);
      prune(timesResult.times.map((t) => t.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar times.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTimes = times.filter((time) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      time.nome_time.toLowerCase().includes(query) ||
      getEquipeLabel(time.departamento).toLowerCase().includes(query) ||
      (time.responsavel?.name.toLowerCase().includes(query) ?? false) ||
      time.pessoasVinculadas.some((person) => person.name.toLowerCase().includes(query));

    const matchesDepartment = !departmentFilter || time.departamento === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const { selectedIds, toggleSelected, toggleAllVisible, allSelected, prune } =
    useSelecao(filteredTimes);

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

    setMessage("");
    setError("");

    try {
      await deleteTime(timeToDelete.id);
      setTimeToDelete(null);
      setMessage("Time excluído com sucesso.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir time.");
    }
  }

  // Comercial e suporte não pertencem a times
  const usuariosElegiveis = users.filter(
    (user) => user.role !== "comercial" && user.role !== "suporte",
  );

  if (mostrarTime) {
    return (
      <CadastroTimes
        onVoltar={() => setMostrarTime(false)}
        onCadastrado={async () => {
          setMostrarTime(false);
          await load();
        }}
      />
    );
  }

  return (
    <Main className="relative">
      {/* Formulário de edição */}

      <EditModal isOpen={!!editing} title="Editar time">
        <form className="grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={salvarEdicao}>
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
            {equipesDeTime.map((equipe) => (
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
            {usuariosElegiveis.map((user) => (
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
            {usuariosElegiveis
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
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" variant="primary">
              Salvar alterações
            </Button>
            <Button type="button" variant="secondary" onClick={cancelarEdicao}>
              Cancelar
            </Button>
          </div>
        </form>
      </EditModal>
      <Content>
        {/* Cabeçalho */}

        <Header icon={UsersRound} title="Times" subtitle="Gerencie as equipes e seus integrantes.">
          <Button type="button" variant="primary" size="lg" onClick={() => setMostrarTime(true)}>
            <span className="flex items-center gap-2">
              <Plus size={19} />
              <span className="hidden @3xl:block">Novo time</span>
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
            searchPlaceholder="Buscar por nome do time, responsável ou integrante"
            searchLabel="Buscar times"
            filter={departmentFilter}
            onFilterChange={setDepartmentFilter}
            filterOptions={equipesDeTime}
            filterPlaceholder="Selecione uma equipe"
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
            <p className="text-text-muted px-5 py-4">Carregando times...</p>
          ) : filteredTimes.length === 0 ? (
            <p className="text-text-muted px-5 py-4">
              {times.length === 0 ? "Nenhum time cadastrado." : "Nenhum time encontrado."}
            </p>
          ) : (
            <div className="divide-border divide-y">
              {filteredTimes.map((time) => {
                const isSelected = selectedIds.includes(time.id);

                return (
                  <div
                    key={time.id}
                    className="border-border grid grid-cols-[28px_40px_minmax(0,1fr)_36px] items-center gap-3 px-3 py-4 @3xl:grid-cols-[28px_40px_minmax(130px,1.1fr)_minmax(110px,0.8fr)_36px] @3xl:gap-4 @4xl:grid-cols-[28px_40px_minmax(130px,1.1fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_36px] @6xl:grid-cols-[28px_40px_minmax(130px,1.1fr)_minmax(120px,1fr)_minmax(150px,1.2fr)_minmax(110px,0.8fr)_36px]"
                  >
                    {/* Check */}

                    <button
                      type="button"
                      onClick={() => toggleSelected(time.id)}
                      aria-label={
                        isSelected ? `Desmarcar ${time.nome_time}` : `Selecionar ${time.nome_time}`
                      }
                      aria-pressed={isSelected}
                      className="flex size-4 cursor-pointer items-center justify-center"
                    >
                      <Checkbox checked={isSelected} />
                    </button>

                    {/* Avatar */}
                    <div className="bg-primary-muted text-primary flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold">
                      {getInitials(time.nome_time)}
                    </div>

                    {/* Nome e Departamento (Mobile) */}
                    <div className="min-w-0">
                      <span className="text-text block truncate text-sm font-semibold">
                        {time.nome_time}
                      </span>
                      <span className="text-text-muted flex text-xs text-nowrap @6xl:hidden">
                        {getEquipeLabel(time.departamento)}{" "}
                        <span className="ml-1 block @4xl:hidden">
                          - {time.responsavel?.name ?? "Não definido"}
                        </span>
                      </span>
                    </div>

                    {/* Responsável */}
                    <span className="text-text-muted hidden truncate text-center text-xs @4xl:block @6xl:text-sm">
                      {time.responsavel?.name ?? "Não definido"}
                    </span>

                    {/* Pessoas Vinculadas */}
                    <div className="group relative hidden w-fit min-w-0 flex-nowrap items-center gap-0 place-self-center transition-all duration-200 ease-in-out hover:gap-4.75 @3xl:flex @5xl:hover:gap-3.75 @6xl:hover:gap-2.75">
                      {time.pessoasVinculadas.length === 0 ? (
                        <span className="text-text-muted text-sm">Nenhuma</span>
                      ) : (
                        <>
                          {time.pessoasVinculadas
                            .slice(0, NUM_PESSOAS_VINCULADAS)
                            .map((person, index) => (
                              <div
                                key={person.id}
                                /* O avatar principal ganha z-index normal e overflow hidden para o fundo não vazar */
                                className="group/avt relative -ml-4 flex size-6 cursor-pointer items-center justify-center rounded-full text-[8px] font-semibold first:ml-0 @3xl:size-7 @3xl:text-[10px] @5xl:-ml-3 @6xl:-ml-2"
                                style={{ zIndex: index }}
                              >
                                {/* Fundo sólido com a cor do background do app para tampar o avatar de baixo */}
                                <div className="bg-bg ring-bg absolute inset-0 -z-10 rounded-full ring-2 group-hover:ring-0" />

                                {/* Camada da cor translúcida por cima do fundo sólido */}
                                <div className="bg-primary-muted absolute inset-0 -z-10 rounded-full" />

                                {/* Texto das iniciais */}
                                <span className="text-primary relative z-10">
                                  {getInitials(person.name)}
                                </span>

                                <div className="bg-bg text-text-muted border-border text-2xs py-0.7 absolute -top-2 z-1 scale-0 rounded-full border px-2 text-nowrap transition-all duration-200 group-hover/avt:-top-5.5 group-hover/avt:scale-100 @3xl:text-xs @3xl:group-hover/avt:-top-6.5">
                                  {person.name}
                                </div>
                              </div>
                            ))}
                          {time.pessoasVinculadas.length > NUM_PESSOAS_VINCULADAS && (
                            <span className="text-text-muted ml-4 self-center text-xs transition-all duration-200 group-hover:-ml-2 @5xl:ml-3 @5xl:group-hover:-ml-1 @6xl:ml-2 @6xl:group-hover:ml-0">
                              +{time.pessoasVinculadas.length - NUM_PESSOAS_VINCULADAS}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Departamento */}
                    <span className="bg-primary-muted text-text-muted hidden w-fit items-center gap-1 place-self-center rounded-full px-2.5 py-0.75 text-xs @[1320px]:gap-2 @[1320px]:px-3 @[1320px]:py-1 @[1320px]:text-sm @6xl:flex">
                      <ClipboardList className="size-3 @[1320px]:size-3.5" />
                      {getEquipeLabel(time.departamento)}
                    </span>

                    <div className="relative justify-self-end">
                      <button
                        type="button"
                        aria-label={`Ações para ${time.nome_time}`}
                        onClick={() => setOpenMenu(openMenu === time.id ? null : time.id)}
                        className="text-text-muted hover:text-primary cursor-pointer rounded p-1"
                      >
                        <MoreHorizontal size={21} />
                      </button>

                      {openMenu === time.id && (
                        <DropdownMenu>
                          <EditButton
                            type="button"
                            onClick={() => abrirEdicao(time)}
                            text="Editar"
                            icon={SquarePen}
                          />

                          {isSuperusuario && (
                            <EditButton
                              type="button"
                              onClick={() => {
                                setTimeToDelete(time);
                                setOpenMenu(null);
                              }}
                              variant="danger"
                              text="Excluir"
                              icon={Trash}
                            />
                          )}
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Content>

      {/* Confirmação de exclusão */}
      <ConfirmModal
        isOpen={!!timeToDelete}
        title="Excluir time"
        description={
          <>
            Deseja excluir o time{" "}
            <strong className="text-text font-semibold">{timeToDelete?.nome_time}</strong>?
          </>
        }
        onCancel={() => setTimeToDelete(null)}
        onConfirm={confirmarExclusao}
      />
    </Main>
  );
}
