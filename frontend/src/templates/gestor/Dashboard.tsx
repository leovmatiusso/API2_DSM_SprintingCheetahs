import { useEffect, useState } from "react";

import { ClipboardList, Clock, CheckCircle2, CircleAlert } from "lucide-react";

import { getCurrentUser } from "@/auth";
import { Card, MiniCard, MetricCard } from "@/components/ui/Card";
import { getDashboardResumo } from "@/api";
import type { DashboardResumo } from "@/api";

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
  }, []);

  if (!user) return null;

  return (
    <main className="bg-bg-secondary text-text min-h-90dvh px-4 py-8 lg:p-8">
      {/* Conteúdo */}
      <section>
        <p className="text-text-muted mb-1 text-sm">Painel inicial</p>

        <h1 className="mb-6 text-3xl font-bold">Olá, {user.name}</h1>
        {erro && (
          <p className="text-danger mb-4 text-sm" role="alert">
            {erro}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 @4xl:grid-cols-10">
          {/* Card - Projetos em andamento */}
          <MetricCard title="Projetos em andamento" valor={resumo?.projetos} className="@4xl:col-span-6">
            <MiniCard
                icon={ClipboardList}
                color="bg-blue-200"
                title="Total de OS"
                valor={resumo?.ordens.total}
                description="OS em todos os status"
              />

              <MiniCard
                icon={Clock}
                color="bg-green-200"
                title="OS em andamento"
                valor={resumo?.ordens.andamento}
                description="Sendo tratadas"
              />

              <MiniCard
                icon={CheckCircle2}
                color="bg-pink-200"
                title="OS concluídas"
                valor={resumo?.ordens.concluidas}
                description="Total de OS concluídas"
              />
          </MetricCard>

          {/* Card - O.S. por equipe */}
          <Card className="@4xl:col-span-4">
            <div className="mb-5">
              <p className="text-text text-2xl font-bold">O.S. por equipe</p>
            </div>
            <div className="space-y-3 @3xl:space-y-5">
              {[
                {
                  nome: "Produção",
                  cor: "bg-blue-300",
                  total: resumo?.ordens.porDepartamento.producao,
                },
                {
                  nome: "Software",
                  cor: "bg-green-300",
                  total: resumo?.ordens.porDepartamento.software,
                },
                {
                  nome: "Monitoramento",
                  cor: "bg-orange-300",
                  total: resumo?.ordens.porDepartamento.monitoramento,
                },
                {
                  nome: "Implantação",
                  cor: "bg-pink-300",
                  total: resumo?.ordens.porDepartamento.implantacao,
                },
              ].map((time) => (
                <div key={time.nome}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`size-2 @3xl:size-3 shrink-0 rounded-full ${time.cor}`}></span>
                    <span className="text-sm font-medium">{time.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary h-1.5 @3xl:h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${time.cor}`}
                        style={{
                          width: `${resumo && resumo.ordens.total > 0 ? (Number(time.total ?? 0) / resumo.ordens.total) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                    <strong className="text-sm">{time.total ?? "—"}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card - Manutenções em andamento */}
          <MetricCard title="Manutenções em andamento" valor={resumo?.manutencoes.total} className="@4xl:col-span-6">
            <MiniCard
                icon={ClipboardList}
                color="bg-blue-200"
                title="Abertas"
                valor={resumo?.manutencoes.abertas}
                description="Total em aberto"
              />

              <MiniCard
                icon={Clock}
                color="bg-green-200"
                title="Em andamento"
                valor={resumo?.manutencoes.andamento}
                description="Sendo tratadas"
              />

              <MiniCard
                icon={CircleAlert}
                color="bg-red-200"
                title="Em alerta"
                valor={resumo?.manutencoes.alerta}
                description="Total em alerta"
              />
          </MetricCard>
        </div>
      </section>
    </main>
  );
}
