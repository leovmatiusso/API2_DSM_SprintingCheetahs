import { FormEvent, useEffect, useState } from "react";

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
];

export default function Cadastro() {
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.time_id) {
      setError("Selecione o time do usuário.");

      return;
    }

    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        time_id: form.time_id,
      });

      setMessage("Usuário cadastrado com sucesso.");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "comercial",
        time_id: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar usuário.");
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <strong>Cadastro de usuário</strong>

          <span className="role-badge">
            {user.role === "superusuario" ? "Superusuário" : "Gestor"}
          </span>
        </div>

        <div className="nav-actions">
          <Button variant="secondary" onClick={() => navigate("/minha-conta")}>
            Minha conta
          </Button>

          <Button variant="secondary" onClick={sair}>
            Sair
          </Button>
        </div>
      </header>

      <section className="card content flex flex-col gap-5">
        <h1>Novo usuário</h1>

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

          <div className="col-span-full space-x-5">
            <Button type="submit" variant="primary" size="lg">
              Cadastrar
            </Button>

            <Button type="button" variant="outline" size="lg" onClick={() => navigate("/usuarios")}>
              Visualizar usuários
            </Button>
          </div>
        </form>

        {message && <div className="success">{message}</div>}

        {error && <div className="error">{error}</div>}
      </section>
    </main>
  );
}
