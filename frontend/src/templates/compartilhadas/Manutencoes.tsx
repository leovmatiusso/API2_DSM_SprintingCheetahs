import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";

import { getManutencoes } from "@/api";
import type { ManutencaoResumo } from "@/api";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  STATUS_ITEM_CLASSE,
  STATUS_ITEM_LABEL,
} from "./osEstilos";
import SeletorStatusManutencao from "./SeletorStatusManutencao";

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
                <div className="flex items-center gap-2 py-1">
                  <span className="text-text mr-1 text-sm font-semibold">Status:</span>
                  <SeletorStatusManutencao
                    manutencaoId={manutencao.id}
                    manutencaoResumo={manutencao.resumo}
                    status={manutencao.status_manutencao}
                    onStatusChange={(status_manutencao) =>
                      setManutencoes((atuais) => atuais.map((item) =>
                        item.id === manutencao.id ? { ...item, status_manutencao } : item,
                      ))
                    }
                  />
                </div>
              </Ticket>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
