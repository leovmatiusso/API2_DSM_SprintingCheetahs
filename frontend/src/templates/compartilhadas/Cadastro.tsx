import { FormEvent, useEffect, useState } from "react";
import { UserRound } from "lucide-react";

import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PasswordInput from "@/components/PasswordInput";

import { createUser, getTimes } from "@/api";

import { getCurrentUser, logout } from "@/auth";

import type { Role, Time } from "@/types";

const roles: {
  value: Role;
  label: string;
}[] = [
  {
    value: "superusuario",
    label: "Superusuário",
  },
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
  {
    value: "monitoramento",
    label: "Monitoramento",
  },
];

interface CadastroProps {
  onVoltar: () => void;
  onCadastrado?: () => void | Promise<void>;
}

export default function Cadastro({
  onVoltar,
  onCadastrado,
}: CadastroProps) {
  const navigate = useNavigate();

  const user = getCurrentUser();

  const [times, setTimes] = useState<Time[]>([]);

  const [loadingTimes, setLoadingTimes] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "comercial" as Role,
    time_id: "",
  });

  useEffect(() => {
    async function loadTimes() {
      try {
        const result = await getTimes();

        setTimes(result.times);
      } catch {
        setTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    }

    loadTimes();
  }, []);

  if (!user) {
    return null;
  }

  function sair() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  // Comercial e suporte não pertencem a times
  const semTime = form.role === "comercial" || form.role === "suporte";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!semTime && !form.time_id) {
      setError("Selecione o time do usuário.");

      return;
    }

    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        time_id: semTime ? "" : form.time_id,
      });

      setMessage("Usuário cadastrado com sucesso.");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "comercial",
        time_id: "",
      });
      await onCadastrado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar usuário.");
    }
  }

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <header className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <UserRound size={32} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
              Novo usuário
            </h1>
            <p className="text-text-muted m-0 text-sm md:text-base">
              Cadastre um usuário e configure seu acesso ao sistema.
            </p>
          </div>
        </header>

        <section className="card content flex flex-col gap-5">

        <form className="grid grid-cols-2 gap-5 col-span-full" onSubmit={handleSubmit}>
          <Input
            label="Nome"
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <Input
            label="Email"
            required
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <PasswordInput
            label="Senha"
            value={form.password}
            onChange={(value) =>
              setForm({
                ...form,
                password: value,
              })
            }
            placeholder="Mínimo 6 caracteres"
            required
          />

          <Select
            label="Cargo do usuário"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as Role,
              })
            }
            required
          >
            <option value="" hidden>
              Selecione um cargo
            </option>

            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>

          {!semTime && (
          <Select
            label={"Time do usuário"}
            value={form.time_id}
            onChange={(e) =>
              setForm({
                ...form,
                time_id: e.target.value,
              })
            }
            required
            disabled={loadingTimes}
          >
            <option value="">{loadingTimes ? "Carregando times..." : "Selecione um time"}</option>

            {times.map((time) => (
              <option key={time.id} value={time.id}>
                {time.nome_time}
              </option>
            ))}
          </Select>
          )}

          <div className="col-span-full space-x-5">
            <Button type="submit" variant="primary" size="lg">
              Cadastrar
            </Button>

            <Button type="button" variant="outline" size="lg" onClick={onVoltar}>
              Voltar para usuários
            </Button>
          </div>
        </form>

        {message && <div className="success">{message}</div>}

        {error && <div className="error">{error}</div>}
      </section>
      </div>
    </main>
  );
}
