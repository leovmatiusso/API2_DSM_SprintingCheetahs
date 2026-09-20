import {
  useState,
  FormEvent
} from "react";

import type { Role } from "../types";
import {
  getCurrentUser,
  logout
} from "../auth";

import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

const labels: Record<Role, string> = {
  superusuario: "Superusuário",
  gestor: "Gestor",
  comercial: "Comercial",
  suporte: "Suporte",
  producao: "Produção",
  software: "Software",
  implantacao: "Implantação"
};

type TabType =
  | "usuario"
  | "time";

interface NovoUsuarioForm {
  primeiroNome: string;
  sobrenome: string;
  email: string;
  timeUsuario: string;
  cargoUsuario: string;
}

interface NovoTimeForm {
  nomeTime: string;
  pessoaResponsavel: string;
  email: string;
  pessoasVinculadas: string;
  equipeRelacionada: string;
}

export default function Cadastro() {
  const navigate = useNavigate();

  const user = getCurrentUser();

  const [
    activeTab,
    setActiveTab
  ] = useState<TabType>("usuario");

  if (!user) {
    return null;
  }

  function sair() {
    logout();

    navigate("/login", {
      replace: true
    });
  }

  function visualizarUsuarios() {
    navigate("/usuarios");
  }

  return (
    <>
      <header className="topbar">
        <div>
          <strong>
            Sistema de O.S.
          </strong>

          <span className="role-badge">
            {labels[user.role]}
          </span>
        </div>

        <nav className="nav-actions">

          <Button
            variant="secondary"
            onClick={() =>
              navigate("/minha-conta")
            }
          >
            Minha conta
          </Button>

          <Button
            variant="secondary"
            onClick={sair}
          >
            Sair
          </Button>

        </nav>
      </header>

      <main className="p-10">

        <div className="flex">

          <TabButton
            label="Cadastrar usuário"
            isActive={
              activeTab === "usuario"
            }
            onClick={() =>
              setActiveTab("usuario")
            }
          />

          <TabButton
            label="Cadastrar time"
            isActive={
              activeTab === "time"
            }
            onClick={() =>
              setActiveTab("time")
            }
          />

        </div>

        <div className="bg-bg rounded-br-2xl shadow-lg/5 rounded-tr-2xl p-18">

          {activeTab === "usuario" ? (
            <CadastrarUsuarioForm
              onVisualizarUsuarios={
                visualizarUsuarios
              }
            />
          ) : (
            <CadastrarTimeForm
              onVisualizarUsuarios={
                visualizarUsuarios
              }
            />
          )}

        </div>

      </main>
    </>
  );
}

function TabButton({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-6
        py-3
        rounded-t-xl
        text-sm
        font-medium
        transition-colors

        ${
          isActive
            ? "bg-bg text-text"
            : "bg-text/5 text-text/50 hover:text-text/80 cursor-pointer"
        }
      `}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="block text-text/80">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={e =>
          onChange(
            e.target.value
          )
        }
        className="
          w-full
          px-3
          py-1
          -mt-3
          placeholder:text-gray-400
          focus:outline-none
          focus:ring-1
          focus:ring-blue-200
          focus:bg-white
        "
      />

    </div>
  );
}

function CadastrarUsuarioForm({
  onVisualizarUsuarios
}: {
  onVisualizarUsuarios: () => void;
}) {
  const [
    form,
    setForm
  ] = useState<NovoUsuarioForm>({
    primeiroNome: "",
    sobrenome: "",
    email: "",
    timeUsuario: "",
    cargoUsuario: ""
  });

  const setField =
    (
      key: keyof NovoUsuarioForm
    ) =>
    (value: string) =>
      setForm(prev => ({
        ...prev,
        [key]: value
      }));

  function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    console.log(
      "Novo usuário: ",
      form
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
    >

      <h2 className="text-3xl font-bold text-text mb-6">
        Novo usuário
      </h2>

      <div className="grid grid-cols-2 gap-x-24 gap-y-2">

        <Field
          label="Primeiro nome"
          value={
            form.primeiroNome
          }
          onChange={setField(
            "primeiroNome"
          )}
        />

        <Field
          label="Time do usuário"
          value={
            form.timeUsuario
          }
          onChange={setField(
            "timeUsuario"
          )}
        />

        <Field
          label="Sobrenome"
          value={
            form.sobrenome
          }
          onChange={setField(
            "sobrenome"
          )}
        />

        <Field
          label="Cargo do usuário"
          value={
            form.cargoUsuario
          }
          onChange={setField(
            "cargoUsuario"
          )}
        />

        <Field
          label="Email"
          value={
            form.email
          }
          onChange={setField(
            "email"
          )}
          type="email"
        />

      </div>

      <div className="flex justify-end mt-3">

        <Button
          type="submit"
          size="xl"
        >
          Cadastrar
        </Button>

      </div>

      <div className="flex justify-end mt-12">

        <button
          type="button"
          onClick={
            onVisualizarUsuarios
          }
          className="
            bg-indigo-950
            hover:bg-indigo-900
            text-white
            font-medium
            px-6
            py-2
            rounded-lg
            transition-colors
          "
        >
          Visualizar todos os usuários
        </button>

      </div>

    </form>
  );
}

function CadastrarTimeForm({
  onVisualizarUsuarios
}: {
  onVisualizarUsuarios: () => void;
}) {
  const [
    form,
    setForm
  ] = useState<NovoTimeForm>({
    nomeTime: "",
    pessoaResponsavel: "",
    email: "",
    pessoasVinculadas: "",
    equipeRelacionada: ""
  });

  const setField =
    (
      key: keyof NovoTimeForm
    ) =>
    (value: string) =>
      setForm(prev => ({
        ...prev,
        [key]: value
      }));

  function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    console.log(
      "Novo time: ",
      form
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
    >

      <h2 className="text-3xl font-bold text-text mb-6">
        Novo time
      </h2>

      <div className="grid grid-cols-2 gap-x-24 gap-y-2">

        <Field
          label="Nome do time"
          value={
            form.nomeTime
          }
          onChange={setField(
            "nomeTime"
          )}
        />

        <Field
          label="Pessoas Vinculadas"
          value={
            form.pessoasVinculadas
          }
          onChange={setField(
            "pessoasVinculadas"
          )}
        />

        <Field
          label="Pessoa Responsável"
          value={
            form.pessoaResponsavel
          }
          onChange={setField(
            "pessoaResponsavel"
          )}
        />

        <Field
          label="Equipe relacionada"
          value={
            form.equipeRelacionada
          }
          onChange={setField(
            "equipeRelacionada"
          )}
        />

        <Field
          label="Email"
          value={
            form.email
          }
          onChange={setField(
            "email"
          )}
          type="email"
        />

      </div>

      <div className="flex justify-end mt-3">

        <Button
          type="submit"
          size="xl"
        >
          Cadastrar
        </Button>

      </div>

      <div className="flex justify-end mt-12">

        <button
          type="button"
          onClick={
            onVisualizarUsuarios
          }
          className="
            bg-indigo-950
            hover:bg-indigo-900
            text-white
            font-medium
            px-6
            py-2
            rounded-lg
            transition-colors
          "
        >
          Visualizar todos os usuários
        </button>

      </div>

    </form>
  );
}