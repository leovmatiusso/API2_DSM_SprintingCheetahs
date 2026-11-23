import { FormEvent, useEffect, useState } from "react";
import { UsersRound, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
  {
    value: "monitoramento",
    label: "Monitoramento",
  },
];

interface CadastroTimesProps {
  onVoltar: () => void;
  onCadastrado?: () => void | Promise<void>;
}

export default function CadastroTimes({
  onVoltar,
  onCadastrado,
}: CadastroTimesProps) {
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

  function definirResponsavel(id: string) {
    setResponsavelId(id);
    if (id && !pessoasVinculadas.includes(id)) {
      setPessoasVinculadas((atuais) => [...atuais, id]);
    }
  }

  function removerPessoa(id: string) {
    if (id === responsavelId) return;
    setPessoasVinculadas(pessoasVinculadas.filter((item) => item !== id));
  }

  // Comercial e suporte não pertencem a times
  const usuariosElegiveis = users.filter(
    (user) => user.role !== "comercial" && user.role !== "suporte",
  );

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
      setError("Selecione o departamento relacionado.");

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
        usuarios_ids: [...new Set([...pessoasVinculadas, responsavelId])],
      });

      setNomeTime("");
      setDepartamento("");
      setResponsavelId("");
      setPessoasVinculadas([]);

      setMessage("Time cadastrado com sucesso.");
      await onCadastrado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar time.");
    }
  }

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <header className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <UsersRound size={32} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
              Novo time
            </h1>
            <p className="text-text-muted m-0 text-sm md:text-base">
              Cadastre uma equipe e defina seus integrantes.
            </p>
          </div>
        </header>

        <Card className="content flex flex-col gap-5">
        <form className="col-span-full grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
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
            label="Departamento relacionado"
          >
            <option value="" hidden>
              Selecione um departamento
            </option>
            {equipes.map((equipe) => (
              <option key={equipe.value} value={equipe.value}>
                {equipe.label}
              </option>
            ))}
          </Select>

          <Select
            value={responsavelId}
            onChange={(e) => definirResponsavel(e.target.value)}
            required
            label="Pessoa responsável"
            disabled={loadingUsers}
          >
            <option value="">
              {loadingUsers ? "Carregando usuários..." : "Selecione um usuário"}
            </option>
            {usuariosElegiveis.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email}
              </option>
            ))}
          </Select>

          <div>
            <Select
              value=""
              onChange={(e) => adicionarPessoa(e.target.value)}
              label="Pessoas vinculadas"
              disabled={loadingUsers}
            >
              <option hidden value="">
                Selecione um usuário para adicionar
              </option>

              {usuariosElegiveis
                .filter((user) => !pessoasVinculadas.includes(user.id))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </option>
                ))}
            </Select>

            <div className="mt-2 flex min-h-7 flex-wrap gap-2">
              {pessoasVinculadas.length === 0 ? (
                <span className="text-text-muted text-sm">Nenhuma pessoa vinculada.</span>
              ) : (
                pessoasVinculadas.map((id) => {
                  const user = getUser(id);

                  if (!user) {
                    return null;
                  }

                  return (
                    <span
                      className="bg-primary-muted text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                      key={id}
                    >
                      {user.name}
                      {id === responsavelId && (
                        <span className="text-text-muted border-border border-l pl-2 text-xs">Responsável</span>
                      )}
                      {id !== responsavelId && (
                        <button
                          type="button"
                          onClick={() => removerPessoa(id)}
                          aria-label={`Remover ${user.name} do time`}
                          className="hover:bg-primary/10 rounded-full p-0.5"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          <div className="nav-actions flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" variant="primary" size="lg">
              Cadastrar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onVoltar}
              size="lg"
            >
              Voltar para times
            </Button>
          </div>
        </form>

        {message && <div className="success">{message}</div>}

        {error && <div className="error">{error}</div>}
      </Card>
      </div>
    </main>
  );
}
