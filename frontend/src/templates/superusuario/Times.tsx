import "@/style/Usuarios.css";
import "@/style/Times.css";

import { FormEvent, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import { deleteTime, getTimes, getUsers, updateTime } from "@/api";

import { getCurrentUser } from "@/auth";

import type { Role, Time, User } from "@/types";

const equipes: {
  value: Role;
  label: string;
}[] = [
  {
    value: "gestor",
    label: "Gestor",
  },
  {
    value: "comercial",
    label: "Comercial",
  },
  {
    value: "suporte",
    label: "Suporte",
  },
  {
    value: "producao",
    label: "Produção",
  },
  {
    value: "software",
    label: "Software",
  },
  {
    value: "implantacao",
    label: "Implantação",
  },
];

export default function Times() {
  const navigate = useNavigate();

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

  const [nomeTime, setNomeTime] = useState("");

  const [departamento, setDepartamento] = useState("");

  const [responsavelId, setResponsavelId] = useState("");

  const [pessoasVinculadas, setPessoasVinculadas] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [timesResult, usersResult] = await Promise.all([getTimes(), getUsers()]);

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

  if (!currentUser) {
    return null;
  }

  if (!isAllowed) {
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
  }

  function cancelarEdicao() {
    setEditing(null);
    setNomeTime("");
    setDepartamento("");
    setResponsavelId("");
    setPessoasVinculadas([]);
  }

  function adicionarPessoa(id: string) {
    if (!id || pessoasVinculadas.includes(id)) {
      return;
    }

    setPessoasVinculadas([...pessoasVinculadas, id]);
  }

  function removerPessoa(id: string) {
    setPessoasVinculadas(pessoasVinculadas.filter((item) => item !== id));
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();

    if (!editing) {
      return;
    }

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
    if (!timeToDelete) {
      return;
    }

    try {
      await deleteTime(timeToDelete.id);

      setTimeToDelete(null);

      setMessage("Time excluído com sucesso.");

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir time.");
    }
  }

  function getEquipeLabel(value: string) {
    return equipes.find((item) => item.value === value)?.label ?? value;
  }

  return (
    <main className="page">
      <header className="topbar">
        <strong>Gerenciamento de times</strong>

        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </header>

      {editing && (
        <section className="card content">
          <h1>Editar time</h1>

          <form className="user-form" onSubmit={salvarEdicao}>
            <label>
              Nome do time
              <input value={nomeTime} onChange={(e) => setNomeTime(e.target.value)} required />
            </label>

            <label>
              Equipe relacionada
              <select
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
              </select>
            </label>

            <label>
              Pessoa responsável
              <select
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
              </select>
            </label>

            <label>
              Pessoas vinculadas
              <select value="" onChange={(e) => adicionarPessoa(e.target.value)}>
                <option value="">Adicionar usuário</option>

                {users
                  .filter((user) => !pessoasVinculadas.includes(user.id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
              </select>
            </label>

            <div className="linked-users">
              {pessoasVinculadas.map((id) => {
                const user = users.find((item) => item.id === id);

                if (!user) {
                  return null;
                }

                return (
                  <div className="linked-user" key={id}>
                    <span>{user.name}</span>

                    <button type="button" onClick={() => removerPessoa(id)}>
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="nav-actions">
              <Button type="submit" variant="primary">
                Salvar alterações
              </Button>

              <Button type="button" variant="secondary" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            </div>
          </form>
        </section>
      )}

      {message && <div className="success content">{message}</div>}

      {error && <div className="error content">{error}</div>}

      <section className="card content">
        <div className="times-header">
          <h1>Times cadastrados</h1>
        </div>

        {loading ? (
          <p>Carregando times...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome do time</th>

                  <th>Pessoa responsável</th>

                  <th>Pessoas vinculadas</th>

                  <th>Equipe</th>

                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {times.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Nenhum time cadastrado.</td>
                  </tr>
                ) : (
                  times.map((time) => (
                    <tr key={time.id}>
                      <td>{time.nome_time}</td>

                      <td>{time.responsavel ? time.responsavel.name : "Não definido"}</td>

                      <td>
                        <div className="people-list">
                          {time.pessoasVinculadas.length === 0 ? (
                            <span className="muted">Nenhuma</span>
                          ) : (
                            time.pessoasVinculadas.map((person) => (
                              <span key={person.id} className="person-tag">
                                {person.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td>{getEquipeLabel(time.departamento)}</td>

                      <td>
                        <div className="nav-actions">
                          <Button variant="secondary" onClick={() => abrirEdicao(time)}>
                            Editar
                          </Button>

                          {isSuperusuario && (
                            <Button variant="danger" onClick={() => setTimeToDelete(time)}>
                              Excluir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {timeToDelete && (
        <div className="delete-overlay">
          <div className="delete-modal">
            <h2>Excluir time</h2>

            <p>
              Deseja excluir o time <strong>{timeToDelete.nome_time}</strong>?
            </p>

            <div className="delete-actions">
              <button type="button" className="delete-confirm" onClick={confirmarExclusao}>
                Confirmar
              </button>

              <button type="button" className="delete-cancel" onClick={() => setTimeToDelete(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
