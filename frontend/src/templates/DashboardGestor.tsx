import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, CircleAlert, Wrench, Users } from "lucide-react";

import { getCurrentUser, logout } from "../auth";

import Button from "@/components/ui/Button";

export default function DashboardGestor() {
  const navigate = useNavigate();

  const user = getCurrentUser();

  if (!user) return null;

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-bg-secondary p-6 text-text">
      {/* Cabeçalho */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <strong className="text-xl">Sistema de O.S.</strong>

          <span className="ml-3 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
            Gestor
          </span>
        </div>

        <nav className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate("/minha-conta")}>
            Minha conta
          </Button>

          <Button variant="secondary" onClick={sair}>
            Sair
          </Button>
        </nav>
      </header>

      {/* Conteúdo */}
      <section>
        <p className="mb-1 text-sm text-text-muted">Painel inicial</p>

        <h1 className="mb-6 text-3xl font-bold">Olá, {user.name}</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          {/* Card - Projetos em andamento */}
          <section className="rounded-lg border border-gray-400 bg-bg p-6 shadow-sm lg:col-span-6">
            {/* Título do card */}
            <div className="mb-6">
              <p className="text-2xl text-text">Projetos em andamento</p>

              <strong className="mt-1 block text-4xl font-bold text-text">
                12
              </strong>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* O.S. abertas */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black">
                    <ClipboardList size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    OS abertas
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">24</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
                    Total de OS em aberto
                  </span>
                </div>
              </div>

              {/* O.S. em andamento */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black">
                    <Clock size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    OS em andamento
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">5</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
                    Sendo tratadas
                  </span>
                </div>
              </div>

              {/* O.S. em alerta */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black">
                    <CircleAlert size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    OS em alerta
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">8</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
                    Total de OS em alerta
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card - Minhas O.S. por equipe */}
          <section className="rounded-lg border border-gray-400 bg-bg p-6 shadow-sm lg:col-span-4">
            <div className="mb-6">
              <p className="text-2xl font-bold text-text">
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
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
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
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
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
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
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
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[32%] rounded-full bg-pink-300"></div>
                  </div>

                  <strong className="text-sm">4</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Card - Manutenções em andamento */}
          <section className="rounded-lg border border-gray-400 bg-bg p-6 shadow-sm lg:col-span-6">
            <div className="mb-6">
              <p className="text-2xl text-text">Manutenções em andamento</p>

              <strong className="mt-1 block text-4xl font-bold text-text">
                16
              </strong>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* O.S. abertas */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black">
                    <ClipboardList size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    Abertas
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">14</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
                    Total em aberto
                  </span>
                </div>
              </div>

              {/* O.S. em andamento */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black">
                    <Clock size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    Em andamento
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">9</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
                    Sendo tratadas
                  </span>
                </div>
              </div>

              {/* O.S. em alerta */}
              <div className="min-w-0 rounded-xl border border-text/10 bg-bg-secondary p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black">
                    <CircleAlert size={19} />
                  </div>

                  <span className="min-w-0 text-sm font-medium leading-tight">
                    Em alerta
                  </span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">6</strong>

                  <span className="mt-1 block text-xs leading-4 text-text-muted">
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
