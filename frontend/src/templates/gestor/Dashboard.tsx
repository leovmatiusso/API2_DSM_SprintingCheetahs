import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ClipboardList,
  Clock,
  CircleAlert,
  User,
  ChevronDown,
} from "lucide-react";

import { getCurrentUser, logout } from "@/auth";

import Button from "@/components/ui/Button";

export default function Dashboard() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const user = getCurrentUser();

  if (!user) return null;

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="bg-bg-secondary text-text min-h-screen">
      {/* Cabeçalho */}
      <header className="mb-8 py-4 px-6 flex items-center justify-between border-b border-border bg-bg">
        <div>
          <strong className="text-xl">Sistema de O.S.</strong>

          <span className="ml-3 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
            Gestor
          </span>
        </div>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-bg-tertiary"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
              <User size={18} />
            </div>

            <span className="text-sm font-medium">{user.name}</span>

            <ChevronDown
              size={17}
              className={`transition-transform ${
                menuAberto ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {menuAberto && (
            <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-border bg-bg p-1 shadow-md">
              <button
                type="button"
                onClick={() => navigate("/minha-conta")}
                className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-bg-tertiary"
              >
                Minha conta
              </button>

              <button
                type="button"
                onClick={sair}
                className="w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-bg-tertiary"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <section className="px-6 mb-[2%]">
        <p className="text-text-muted mb-1 text-sm">Painel inicial</p>

        <h1 className="mb-6 text-3xl font-bold">Olá, {user.name}</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          {/* Card - Projetos em andamento */}
          <section className="card lg:col-span-6">
            {/* Título do card */}
            <div className="mb-6">
              <p className="text-text text-2xl">Projetos em andamento</p>

              <strong className="text-text mt-1 block text-4xl font-bold">
                12
              </strong>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* O.S. abertas */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black">
                    <ClipboardList size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    OS abertas
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">24</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Total de OS em aberto
                  </span>
                </div>
              </div>

              {/* O.S. em andamento */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black">
                    <Clock size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    OS em andamento
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">5</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Sendo tratadas
                  </span>
                </div>
              </div>

              {/* O.S. em alerta */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black">
                    <CircleAlert size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    OS em alerta
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">8</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Total de OS em alerta
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card - Minhas O.S. por equipe */}
          <section className="card lg:col-span-4">
            <div className="mb-6">
              <p className="text-text text-2xl font-bold">
                Minhas O.S. por equipe
              </p>
            </div>

            {/* Equipes */}
            <div className="space-y-5">
              {/* Equipe de Produção */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-blue-300"></span>

                  <span className="text-sm font-medium">Produção</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[65%] rounded-full bg-blue-300"></div>
                  </div>

                  <strong className="text-sm">8</strong>
                </div>
              </div>

              {/* Equipe de Software */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-green-300"></span>

                  <span className="text-sm font-medium">Software</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[90%] rounded-full bg-green-300"></div>
                  </div>

                  <strong className="text-sm">11</strong>
                </div>
              </div>

              {/* Equipe de Monitoramento */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-orange-300"></span>

                  <span className="text-sm font-medium">Monitoramento</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[32%] rounded-full bg-orange-300"></div>
                  </div>

                  <strong className="text-sm">4</strong>
                </div>
              </div>

              {/* Equipe de Implantação */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-pink-300"></span>

                  <span className="text-sm font-medium">Implantação</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full w-[32%] rounded-full bg-pink-300"></div>
                  </div>

                  <strong className="text-sm">4</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Card - Manutenções em andamento */}
          <section className="card lg:col-span-6">
            <div className="mb-6">
              <p className="text-text text-2xl">Manutenções em andamento</p>

              <strong className="text-text mt-1 block text-4xl font-bold">
                16
              </strong>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* O.S. abertas */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black">
                    <ClipboardList size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    Abertas
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">14</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Total em aberto
                  </span>
                </div>
              </div>

              {/* O.S. em andamento */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black">
                    <Clock size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    Em andamento
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">9</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Sendo tratadas
                  </span>
                </div>
              </div>

              {/* O.S. em alerta */}
              <div className="border-text/10 bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black">
                    <CircleAlert size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">
                    Em alerta
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">6</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Total em alerta
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}