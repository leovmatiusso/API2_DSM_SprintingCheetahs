import { FormEvent, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import { createTime, getUsers } from "@/api";

import { getCurrentUser } from "@/auth";

import type { Role, User } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

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

export default function CadastroTimes() {
  const navigate = useNavigate();

  const currentUser = getCurrentUser();

  const [users, setUsers] = useState<User[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);

  const [nomeTime, setNomeTime] = useState("");

  const [departamento, setDepartamento] = useState("");

  const [responsavelId, setResponsavelId] = useState("");

  const [pessoasVinculadas, setPessoasVinculadas] = useState<string[]>([]);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const result = await getUsers();

        setUsers(result.users);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  if (!currentUser) {
    return null;
  }

  function adicionarPessoa(id: string) {
    if (!id) {
      return;
    }

    if (pessoasVinculadas.includes(id)) {
      return;
    }

    setPessoasVinculadas([...pessoasVinculadas, id]);
  }

  function removerPessoa(id: string) {
    setPessoasVinculadas(pessoasVinculadas.filter((item) => item !== id));
  }

  function getUser(id: string) {
    return users.find((user) => user.id === id);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!nomeTime.trim()) {
      setError("Informe o nome do time.");

      return;
    }

    if (!departamento) {
      setError("Selecione a equipe relacionada.");

      return;
    }

    if (!responsavelId) {
      setError("Selecione a pessoa responsável.");

      return;
    }

    try {
      await createTime({
        nome_time: nomeTime.trim(),
        departamento,
        responsavel_id: responsavelId,
        usuarios_ids: pessoasVinculadas,
      });

      setNomeTime("");
      setDepartamento("");
      setResponsavelId("");
      setPessoasVinculadas([]);

      setMessage("Time cadastrado com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar time.");
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <strong>Cadastro de times</strong>

        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Voltar
        </Button>
      </header>

      <section className="card content flex flex-col gap-5">
        <h1>Novo time</h1>

        <form className="grid grid-cols-2 gap-5 col-span-full" onSubmit={handleSubmit}>
          <Input
            label="Nome do time"
            value={nomeTime}
            onChange={(e) => setNomeTime(e.target.value)}
            required
          />

          <Select
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            required
            label="Equipe relacionada"
          >
            <option value="" hidden>
              Selecione uma equipe
            </option>
            {equipes.map((equipe) => (
              <option key={equipe.value} value={equipe.value}>
                {equipe.label}
              </option>
            ))}
          </Select>

          <Select
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            required
            label="Pessoa responsável"
            disabled={loadingUsers}
          >
            <option value="">
              {loadingUsers ? "Carregando usuários..." : "Selecione um usuário"}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email}
              </option>
            ))}
          </Select>

          <div>
            <Select
              value={responsavelId}
              onChange={(e) => adicionarPessoa(e.target.value)}
              required
              label="Pessoas vinculadas"
              disabled={loadingUsers}
            >
              <option hidden value="">
                Selecione um usuário para adicionar
              </option>

              {users
                .filter((user) => !pessoasVinculadas.includes(user.id))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
            </Select>

            <div className="linked-users">
              {pessoasVinculadas.length === 0 ? (
                <span className="muted">Nenhuma pessoa vinculada.</span>
              ) : (
                pessoasVinculadas.map((id) => {
                  const user = getUser(id);

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
                })
              )}
            </div>
          </div>

          <div className="nav-actions">
            <Button type="submit" variant="primary" size="lg">
              Cadastrar
            </Button>

            <Button type="button" variant="secondary" onClick={() => navigate("/times")} size="lg">
              Visualizar times
            </Button>
          </div>
        </form>

        {message && <div className="success">{message}</div>}

        {error && <div className="error">{error}</div>}
      </section>
    </main>
  );
}
