import { useEffect, useState } from "react";
import { getCurrentUser } from "@/auth";
import { getDashboardResumo } from "@/api";
import type { DashboardResumo } from "@/api";

const status = [
  { label: "Abertas", key: "aberta", color: "bg-primary/30" },
  { label: "Em andamento", key: "emAndamento", color: "bg-success-alt" },
  { label: "Teste", key: "teste", color: "bg-warning-alt" },
  { label: "Concluídas", key: "concluida", color: "bg-primary/50" },
  { label: "Bloqueadas", key: "bloqueado", color: "bg-danger-alt" },
  { label: "Review", key: "review", color: "bg-laranja-alt" },
  { label: "Verificação", key: "verificacao", color: "bg-[var(--rosa-200)]" },
] as const;

const prioridades = [
  { label: "Crítica", key: "critica", color: "bg-danger-alt" },
  { label: "Alta", key: "alta", color: "bg-laranja-alt" },
  { label: "Média", key: "media", color: "bg-warning-alt" },
  { label: "Baixa", key: "baixa", color: "bg-success-alt" },
] as const;

const departamentos = [
  { label: "Produção", key: "producao", color: "bg-primary/30" },
  { label: "Software", key: "software", color: "bg-success-alt" },
  { label: "Monitoramento", key: "monitoramento", color: "bg-danger-alt" },
  { label: "Implantação", key: "implantacao", color: "bg-[var(--rosa-200)]" },
] as const;

function Barras({ titulo, itens, valores }: {
  titulo: string;
  itens: readonly { label: string; key: string; color: string }[];
  valores: Record<string, number>;
}) {
  const max = Math.max(1, ...itens.map((item) => valores[item.key] ?? 0));
  return (
    <section className="border-border bg-bg min-w-0 rounded-xl border p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold">{titulo}</h2>
      <div className="space-y-3">
        {itens.map((item) => {
          const valor = valores[item.key] ?? 0;
          return (
            <div key={item.key}>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className={`size-3 shrink-0 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-bg-tertiary h-2 flex-1 overflow-hidden rounded-full">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(valor / max) * 100}%` }} />
                </div>
                <strong className="w-6 text-right text-sm">{valor}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardOperacional({ tipo }: { tipo: "suporte" | "comercial" }) {
  const user = getCurrentUser();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getDashboardResumo()
      .then((dados) => { if (ativo) setResumo(dados); })
      .catch((error) => {
        if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o dashboard.");
      });
    return () => { ativo = false; };
  }, []);

  if (!user) return null;
  const titulo = tipo === "suporte" ? "Manutenções em andamento" : "Projetos em andamento";
  const total = tipo === "suporte" ? resumo?.manutencoes.total : resumo?.projetos;
  const prioridadeData = resumo?.ordens.porPrioridade ?? { baixa: 0, media: 0, alta: 0, critica: 0 };
  const departamentoData = resumo?.ordens.porDepartamento ?? { producao: 0, software: 0, monitoramento: 0, implantacao: 0 };
  const statusData = resumo?.ordens.porStatus ?? { aberta: 0, emAndamento: 0, teste: 0, concluida: 0, bloqueado: 0, review: 0, verificacao: 0 };

  return (
    <main className="text-text p-4 sm:p-6 lg:p-10">
      <h1 className="mb-5 text-3xl font-bold sm:text-4xl">Olá, {user.name}!</h1>
      {erro && <p className="error" role="alert">{erro}</p>}
      <section className="border-border bg-bg mb-5 rounded-xl border px-5 py-4 text-lg font-semibold">
        {titulo}: <strong>{total ?? "—"}</strong>
      </section>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Barras titulo="OS por prioridade" itens={prioridades} valores={prioridadeData} />
        <Barras titulo="OS por departamento" itens={departamentos} valores={departamentoData} />
      </div>
      <div className="mt-5">
        <Barras titulo="OS por status" itens={status} valores={statusData} />
      </div>
    </main>
  );
}
