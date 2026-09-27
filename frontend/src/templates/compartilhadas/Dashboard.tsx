import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/style/Theme.css"

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
      {/* Conteúdo */}
      <section className="px-6">
        <p className="text-text-muted mb-1 text-sm">Painel inicial</p>

        <h1 className="mb-6 text-3xl font-bold">Olá, {user.name}</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          {/* Card - Projetos em andamento */}
          <section className="card lg:col-span-6">
            {/* Título do card */}
            <div className="mb-6">
              <p className="text-text text-2xl font-bold">Projetos em andamento</p>

              <strong className="text-text mt-1 block text-4xl font-bold">12</strong>
            </div>

            {/* Mini cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* O.S. abertas */}
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black">
                    <ClipboardList size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">OS abertas</span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">24</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Total de OS em aberto
                  </span>
                </div>
              </div>

              {/* O.S. em andamento */}
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black">
                    <Clock size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">OS em andamento</span>
                </div>

                <div className="mt-3 pl-11">
                  <strong className="block text-3xl font-bold">5</strong>

                  <span className="text-text-muted mt-1 block text-xs leading-4">
                    Sendo tratadas
                  </span>
                </div>
              </div>

              {/* O.S. em alerta */}
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black">
                    <CircleAlert size={19} />
                  </div>

                  <span className="min-w-0 text-sm leading-tight font-medium">OS em alerta</span>
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


          {/* Card - Minhas O.S. por status */}
          {user.role == "comercial" && (
            <section className="card lg:col-span-4">

              <div className="mb-6">
                <p className="text-text text-2xl">
                  OS por status
                </p>
              </div>

              {/* Status */}
              <div className="space-y-5">

                {/* Status aberta */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-blue-300"></span>

                    <span className="text-sm font-medium">
                      Aberta
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[65%] rounded-full bg-blue-300"></div>
                    </div>

                    <strong className="text-sm">
                      8
                    </strong>
                  </div>
                </div>

                {/* Status Em andamento */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-success-alt"></span>

                    <span className="text-sm font-medium">
                      Em andamento
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[90%] rounded-full bg-success-alt"></div>
                    </div>

                    <strong className="text-sm">
                      11
                    </strong>
                  </div>
                </div>

                {/* Status Validação / Testes */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-laranja-alt"></span>

                    <span className="text-sm font-medium">
                      Validação / Testes
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[32%] rounded-full bg-laranja-alt"></div>
                    </div>

                    <strong className="text-sm">
                      4
                    </strong>
                  </div>
                </div>

                {/* Status Concluida */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-rosa-alt"></span>

                    <span className="text-sm font-medium">
                      Concluída
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[32%] rounded-full bg-rosa-alt"></div>
                    </div>

                    <strong className="text-sm">
                      4
                    </strong>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* Card - Minhas O.S. por prioridade */}
          {user.role !== "comercial" && (
            <section className="card lg:col-span-4">

              <div className="mb-6">
                <p className="text-text text-2xl font-bold">
                  OS por prioridade
                </p>
              </div>

              {/* Prioridade */}
              <div className="space-y-5">

                {/* Baixa */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-success-alt"></span>

                    <span className="text-sm font-medium">
                      Baixa
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[65%] rounded-full bg-success-alt"></div>
                    </div>

                    <strong className="text-sm">
                      8
                    </strong>
                  </div>
                </div>

                {/* Média */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-warning-alt"></span>

                    <span className="text-sm font-medium">
                      Média
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[90%] rounded-full bg-warning-alt"></div>
                    </div>

                    <strong className="text-sm">
                      11
                    </strong>
                  </div>
                </div>

                {/* Alta */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-laranja-alt"></span>

                    <span className="text-sm font-medium">
                      Alta
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[32%] rounded-full bg-laranja-alt"></div>
                    </div>

                    <strong className="text-sm">
                      4
                    </strong>
                  </div>
                </div>

                {/* Crítica */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-danger-alt"></span>

                    <span className="text-sm font-medium">
                      Crítica
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[32%] rounded-full bg-danger-alt"></div>
                    </div>

                    <strong className="text-sm">
                      4
                    </strong>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* Card - Solicitações recentes */}
          <section className="rounded-lg border border-border bg-bg p-6 shadow-sm lg:col-span-10">

            {/* Título */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-200 text-black">
                <Clock size={19} />
              </div>

              <p className="text-2xl font-bold text-text">
                Solicitações recentes
              </p>
            </div>

            {/* Lista de solicitações */}
            <div className="space-y-3">

              {/* Solicitação 1 */}
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-text/10 bg-bg-secondary p-4 md:grid-cols-4 md:items-center">

                {/* Solicitação */}
                <div className="min-w-0">
                  <strong className="block text-sm font-bold text-text">
                    Desenvolvimento de novo equipamento
                  </strong>

                  <span className="mt-1 block text-xs text-text-muted">
                    Cliente: Roberval • Projeto: Sistema X
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className="text-xs text-text-muted">
                    Status
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-success-alt-inverted">
                    Em andamento
                  </strong>
                </div>

                {/* Prioridade */}
                <div>
                  <span className="text-xs text-text-muted">
                    Prioridade
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-laranja-alt-inverted">
                    Alta
                  </strong>
                </div>

                {/* Data limite */}
                <div>
                  <span className="text-xs text-text-muted">
                    Data limite
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-text">
                    25/09/2026
                  </strong>
                </div>

              </div>

              {/* Solicitação 2 */}
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-text/10 bg-bg-secondary p-4 md:grid-cols-4 md:items-center">

                <div className="min-w-0">
                  <strong className="block text-sm font-bold text-text">
                    Manutenção do sistema
                  </strong>

                  <span className="mt-1 block text-xs text-text-muted">
                    Cliente: Maria • Projeto: Sistema Y
                  </span>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Status
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-success-alt-inverted">
                    Em andamento
                  </strong>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Prioridade
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-warning-alt-inverted">
                    Média
                  </strong>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Data limite
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-text">
                    28/09/2026
                  </strong>
                </div>

              </div>

              {/* Solicitação 3 */}
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-text/10 bg-bg-secondary p-4 md:grid-cols-4 md:items-center">

                <div className="min-w-0">
                  <strong className="block text-sm font-bold text-text">
                    Atualização de equipamento
                  </strong>

                  <span className="mt-1 block text-xs text-text-muted">
                    Cliente: Carlos • Projeto: Sistema Z
                  </span>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Status
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-laranja-alt-inverted">
                    Testes
                  </strong>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Prioridade
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-success-alt-inverted">
                    Baixa
                  </strong>
                </div>

                <div>
                  <span className="text-xs text-text-muted">
                    Data limite
                  </span>

                  <strong className="mt-1 block text-sm font-semibold text-text">
                    30/09/2026
                  </strong>
                </div>

              </div>

            </div>

          </section>

        </div>
      </section>
    </main>
  );
}
