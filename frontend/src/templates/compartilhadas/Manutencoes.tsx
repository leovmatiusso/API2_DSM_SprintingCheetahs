import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Wrench } from "lucide-react";

import { atualizarManutencao, getManutencoes } from "@/api";
import type { ManutencaoResumo } from "@/api";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  STATUS_ITEM_CLASSE,
  STATUS_ITEM_LABEL,
} from "./osEstilos";
import {
  STATUS_MANUTENCAO_LABEL,
  type StatusManutencaoValor,
} from "../compartilhadas/SeletorStatusManutencao";

export default function Manutencoes() {
  const navigate = useNavigate();

  const [manutencoes, setManutencoes] = useState<ManutencaoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await getManutencoes();
        if (ativo) setManutencoes(resposta.manutencoes);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as manutenções.",
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  // Função para atualizar o status diretamente no card
  const handleMudarStatusCard = async (
    id: string,
    novoStatus: StatusManutencaoValor,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation(); // Evita que o clique no select abra a página de detalhes
    try {
      await atualizarManutencao(id, { status_manutencao: novoStatus } as any);
      setManutencoes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status_manutencao: novoStatus } : m))
      );
    } catch (error) {
      console.error("Erro ao atualizar status da manutenção", error);
    }
  };

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <Wrench size={32} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
              Manutenções
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
              Acompanhe e gerencie os pedidos de manutenções
            </p>
          </div>
        </section>

        {carregando ? (
          <p className="text-text-muted text-sm">Carregando manutenções...</p>
        ) : erro ? (
          <p className="text-danger text-sm" role="alert">
            {erro}
          </p>
        ) : manutencoes.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhuma manutenção disponível.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {manutencoes.map((manutencao) => (
              <Ticket
                key={manutencao.id}
                titulo={manutencao.resumo || "Resumo"}
                onClick={() => navigate(`/manutencoes-totais/${manutencao.id}`)}
              >
                <TicketLinha rotulo="Responsável">
                  <span className="font-normal">{manutencao.responsavel ?? "—"}</span>
                </TicketLinha>
                
                <TicketLinha rotulo="Prioridade">
                  <Selo classe={PRIORIDADE_CLASSE[manutencao.prioridade]}>
                    {PRIORIDADE_LABEL[manutencao.prioridade] ?? manutencao.prioridade}
                  </Selo>
                </TicketLinha>
                <div className="flex items-center py-1">
                  <span className="text-text text-sm font-semibold mr-2">Status:</span>
                  <div
                    className="relative w-36"
                    onClick={(e) => e.stopPropagation()}>
                    <select
                      value={manutencao.status_manutencao || "aberta"}
                      onChange={(e) =>
                        handleMudarStatusCard(
                          manutencao.id,
                          e.target.value as StatusManutencaoValor,
                          e
                        )
                      }
                      className="border-border bg-primary-muted text-primary w-full appearance-none rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                      {Object.entries(STATUS_MANUTENCAO_LABEL).map(([val, label]) => (
                        <option key={val} value={val} className="bg-bg text-text">
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-primary">
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>
              </Ticket>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
