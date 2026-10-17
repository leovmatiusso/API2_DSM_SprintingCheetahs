import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ClipboardList,
  Clock,
  CircleAlert,
} from "lucide-react";

import { getCurrentUser, logout } from "@/auth";
import { getDashboardResumo } from "@/api";
import type { DashboardResumo } from "@/api";
import { PRIORIDADE_CLASSE, PRIORIDADE_LABEL, STATUS_CLASSE, STATUS_LABEL, formatarData } from "./osEstilos";


export default function Dashboard() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const user = getCurrentUser();

  useEffect(() => {
    let ativo = true;
    getDashboardResumo()
      .then((dados) => { if (ativo) setResumo(dados); })
      .catch((error) => { if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o dashboard."); });
    return () => { ativo = false; };
  }, []);

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
        {erro && <p className="text-danger mb-4 text-sm" role="alert">{erro}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <section className="card lg:col-span-6">
            <div className="mb-6">
              <p className="text-text text-2xl">Projetos em andamento</p>
              <strong className="text-text mt-1 block text-4xl font-bold">{resumo?.projetos ?? "—"}</strong>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4"><div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black"><ClipboardList size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">OS abertas</span></div><div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.ordens.abertas ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Total de OS em aberto</span></div></div>
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4"><div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black"><Clock size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">OS em andamento</span></div><div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.ordens.andamento ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Sendo tratadas</span></div></div>
              <div className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4"><div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black"><CircleAlert size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">OS em alerta</span></div><div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.ordens.alerta ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Total de OS em alerta</span></div></div>
            </div>
          </section>

          {user.role == "comercial" && (
            <section className="card lg:col-span-4">
              <div className="mb-6"><p className="text-text text-2xl">OS por status</p></div>
              <div className="space-y-5">
                {[
                  { label: "Abertas", value: resumo?.ordens.abertas, color: "bg-blue-300" },
                  { label: "Em andamento", value: resumo?.ordens.andamento, color: "bg-green-300" },
                  { label: "Validação / Testes", value: resumo?.ordens.emTeste, color: "bg-orange-300" },
                  { label: "Concluída", value: resumo?.ordens.concluidas, color: "bg-pink-300" },
                ].map((item) => <div key={item.label}><div className="mb-2 flex items-center gap-2"><span className={`h-3 w-3 shrink-0 rounded-full ${item.color}`}></span><span className="text-sm font-medium">{item.label}</span></div><div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${item.color}`} style={{ width: resumo ? `${resumo.ordens.total ? (Number(item.value ?? 0) / resumo.ordens.total) * 100 : 0}%` : "0%" }}></div></div><strong className="text-sm">{item.value ?? "—"}</strong></div></div>)}
              </div>
            </section>
          )}

          {user.role !== "comercial" && (
            <section className="card lg:col-span-4">
              <div className="mb-6"><p className="text-text text-2xl font-bold">Minhas O.S. por equipe</p></div>
              <div className="space-y-5">
                {[
                  { nome: "Produção", color: "bg-blue-300", value: resumo?.ordens.porDepartamento.producao },
                  { nome: "Software", color: "bg-green-300", value: resumo?.ordens.porDepartamento.software },
                  { nome: "Monitoramento", color: "bg-orange-300", value: resumo?.ordens.porDepartamento.monitoramento },
                  { nome: "Implantação", color: "bg-pink-300", value: resumo?.ordens.porDepartamento.implantacao },
                ].map((time) => <div key={time.nome}><div className="mb-2 flex items-center gap-2"><span className={`h-3 w-3 shrink-0 rounded-full ${time.color}`}></span><span className="text-sm font-medium">{time.nome}</span></div><div className="flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${time.color}`} style={{ width: resumo ? `${resumo.ordens.total ? (Number(time.value ?? 0) / resumo.ordens.total) * 100 : 0}%` : "0%" }}></div></div><strong className="text-sm">{time.value ?? "—"}</strong></div></div>)}
              </div>
            </section>
          )}

          <section className="card lg:col-span-6">
            <div className="mb-6">
              <p className="text-text text-2xl">Manutenções em andamento</p>
              <strong className="text-text mt-1 block text-4xl font-bold">{resumo?.manutencoes.total ?? "—"}</strong>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link to="/manutencoes-totais" className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4 no-underline">
                <div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-200 text-black"><ClipboardList size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">Abertas</span></div>
                <div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.manutencoes.abertas ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Total em aberto</span></div>
              </Link>
              <Link to="/manutencoes-totais" className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4 no-underline">
                <div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-200 text-black"><Clock size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">Em andamento</span></div>
                <div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.manutencoes.andamento ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Sendo tratadas</span></div>
              </Link>
              <Link to="/manutencoes-totais" className="border-border bg-bg-secondary min-w-0 rounded-xl border p-4 no-underline">
                <div className="flex min-w-0 items-center gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-200 text-black"><CircleAlert size={19} /></div><span className="min-w-0 text-sm leading-tight font-medium">Em alerta</span></div>
                <div className="mt-3 pl-11"><strong className="block text-3xl font-bold">{resumo?.manutencoes.alerta ?? "—"}</strong><span className="text-text-muted mt-1 block text-xs leading-4">Total em alerta</span></div>
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-bg p-6 shadow-sm lg:col-span-10">
            <div className="mb-6 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-200 text-black"><Clock size={19} /></div><p className="text-2xl font-bold text-text">Solicitações recentes</p></div>
            {erro ? <p className="text-danger text-sm" role="alert">{erro}</p> : !resumo ? <p className="text-text-muted text-sm">Carregando solicitações...</p> : resumo.ordens.recentes.length === 0 ? <p className="text-text-muted text-sm">Nenhuma solicitação encontrada.</p> : (
              <div className="space-y-3">
                {resumo.ordens.recentes.slice(0, 3).map((os) => <button key={os.id} type="button" onClick={() => navigate(`/os/disponiveis/${os.id}`)} className="grid w-full grid-cols-1 gap-4 rounded-lg border border-text/10 bg-bg-secondary p-4 text-left md:grid-cols-4 md:items-center"><div className="min-w-0"><strong className="block text-sm font-bold text-text">{os.titulo}</strong><span className="text-text-muted mt-1 block text-xs">Time: {os.time?.nome ?? "—"} · {os.departamento ?? "—"}</span></div><div><span className="text-xs text-text-muted">Status</span><strong className="mt-1 block text-sm font-semibold"><span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[os.status]}`}>{STATUS_LABEL[os.status] ?? os.status}</span></strong></div><div><span className="text-xs text-text-muted">Prioridade</span><strong className="mt-1 block text-sm font-semibold"><span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORIDADE_CLASSE[os.prioridade]}`}>{PRIORIDADE_LABEL[os.prioridade] ?? os.prioridade}</span></strong></div><div><span className="text-xs text-text-muted">Data limite</span><strong className="mt-1 block text-sm font-semibold">{formatarData(os.data_limite)}</strong></div></button>)}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
