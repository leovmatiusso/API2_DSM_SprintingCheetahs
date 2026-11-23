import { useEffect, useState } from "react";

import { getCurrentUser } from "@/auth";
import { getDashboardResumo } from "@/api";
import type { DashboardResumo } from "@/api";

const status = [
  { label: "Abertas", key: "abertas", color: "blue" },
  { label: "Em andamento", key: "andamento", color: "green" },
  { label: "Bloqueadas", key: "alerta", color: "red" },
  { label: "Review", key: "emTeste", color: "orange" },
] as const;
const prioridades = [
  { label: "Baixa", color: "green", key: "baixa" as const },
  { label: "Média", color: "yellow", key: "media" as const },
  { label: "Alta", color: "orange", key: "alta" as const },
  { label: "Crítica", color: "red", key: "critica" as const },
];

function Indicadores({
  titulo,
  total,
  dados,
}: {
  titulo: string;
  total: number | string;
  dados: DashboardResumo["ordens"] | DashboardResumo["manutencoes"];
}) {
  const valores = dados as Record<string, number>;
  const cores: Record<string, string> = {
    blue: "bg-primary/20 text-primary",
    green: "bg-success-alt text-success-alt-inverted",
    red: "bg-danger-alt text-danger-alt-inverted",
    orange: "bg-laranja-alt text-laranja-alt-inverted",
    yellow: "bg-warning-alt text-warning-alt-inverted",
  };
  const valorPrioridade = (key: (typeof prioridades)[number]["key"]) =>
    "porPrioridade" in dados ? dados.porPrioridade?.[key] ?? 0 : 0;

  return (
    <section className="border-border bg-bg min-w-0 rounded-xl border p-5 sm:p-7">
      <h2 className="mb-1 flex items-baseline gap-3 font-semibold sm:text-xl"> {titulo}:
        <strong className="text-2xl font-bold">{total}</strong>
      </h2>

      <h3 className="text-text-muted mb-1 font-medium">OS por status</h3>
      
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
        {status.map((item) => (
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border border-border px-4 min-h-8 sm:px-5 ${cores[item.color]}`}
            key={item.key}
          >
            <span className="font-medium">{item.label}</span>
            <strong className="text-xl">{valores[item.key] ?? 0}</strong>
          </div>
        ))}
      </div>
      <h3 className="text-text-muted mb-1 font-medium">OS por prioridade</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
        {prioridades.map((item) => (
          <div
            className={`flex min-h-8 items-center justify-between gap-3 rounded-lg border border-border px-4 sm:px-5 ${cores[item.color]}`}
            key={item.label}
          >
            <span className="font-medium">{item.label}</span>
            <strong className="text-xl">{valorPrioridade(item.key)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const user = getCurrentUser();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getDashboardResumo()
      .then((dados) => {
        if (ativo) setResumo(dados);
      })
      .catch((error) => {
        if (ativo)
          setErro(
            error instanceof Error ? error.message : "Não foi possível carregar o dashboard.",
          );
      });
    return () => {
      ativo = false;
    };
  }, [])

  if (!user) return null
  const departamentos = [
    { nome: "Produção", valor: resumo?.ordens.porDepartamento.producao, cor: "blue" },
    { nome: "Software", valor: resumo?.ordens.porDepartamento.software, cor: "green" },
    { nome: "Monitoramento", valor: resumo?.ordens.porDepartamento.monitoramento, cor: "danger" },
    { nome: "Implantação", valor: resumo?.ordens.porDepartamento.implantacao, cor: "rosa" },
  ];

  const max = Math.max(1, ...departamentos.map((item) => item.valor ?? 0));
  const coresBarra: Record<string, string> = {
    blue: "bg-primary/30",
    green: "bg-success-alt",
    danger: "bg-danger-alt",
    rosa: "bg-[var(--rosa-200)]",
  };
  
  return (
    <main className="text-text p-4 sm:p-6 lg:p-10">
      <h1 className="mb-6 text-3xl font-bold *:sm:text-4xl">Olá, {user.name}!</h1>
      {erro && (
        <p className="error" role="alert">
          {erro}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Indicadores
          titulo="Projetos em andamento"
          total={resumo?.projetos ?? "—"}
          dados={
            resumo?.ordens ?? {
              abertas: 0,
              andamento: 0,
              alerta: 0,
              concluidas: 0,
              total: 0,
              emTeste: 0,
              porDepartamento: { producao: 0, software: 0, monitoramento: 0, implantacao: 0 },
            }
          }
        />
        <Indicadores
          titulo="Manutenções em andamento"
          total={resumo?.manutencoes.total ?? "—"}
          dados={resumo?.manutencoes ?? { total: 0, abertas: 0, andamento: 0, alerta: 0 }}
        />
      </div>
      <section className="border-border bg-bg mt-5 rounded-xl border p-5 sm:p-7">
        <h2 className="mb-4 text-xl font-medium">Total de OS por departamento</h2>
        {departamentos.map((item) => (
          <div
            className="my-3 grid grid-cols-[minmax(100px,1fr)_minmax(40px,5fr)_24px] items-center gap-2 sm:gap-3"
            key={item.nome}
          >
            <span className="flex items-center gap-2 text-sm">
              <i className={`h-3.5 w-3.5 rounded-full ${coresBarra[item.cor]}`} />
              {item.nome}
            </span>
            <div className="bg-bg-tertiary h-3.5 overflow-hidden rounded-full">
              <i
                className={`block h-full rounded-full ${coresBarra[item.cor]}`}
                style={{ width: `${((item.valor ?? 0) / max) * 100}%` }}
              />
            </div>
            <b>{item.valor ?? "—"}</b>
          </div>
        ))}
      </section>
    </main>
  );
}
