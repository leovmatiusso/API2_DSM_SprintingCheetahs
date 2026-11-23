import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";

import { getManutencoes } from "@/api";
import type { ManutencaoResumo } from "@/api";

import { ItemLista, Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
} from "./osEstilos";
import SeletorStatusManutencao from "./SeletorStatusManutencao";
import AlternarVisualizacao, { useModoVisualizacao } from "./AlternarVisualizacao";
import FiltroItens from "./FiltroItens";
import { STATUS_ITEM_LABEL } from "./osEstilos";

export default function Manutencoes() {
  const navigate = useNavigate();
  const [modo, setModo] = useModoVisualizacao("manutencoes");

  const [manutencoes, setManutencoes] = useState<ManutencaoResumo[]>([]);
  const [filtros, setFiltros] = useState({ status: "", prioridade: "" });
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
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-muted text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
              <Wrench size={32} />
            </div>
            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold">
                Manutenções
              </h1>
              <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
                Acompanhe e gerencie os pedidos de manutenções
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiltroItens status={filtros.status} prioridade={filtros.prioridade} opcoesStatus={Object.entries(STATUS_ITEM_LABEL).map(([value, label]) => ({ value, label }))} aoMudar={(campo, valor) => setFiltros((atuais) => ({ ...atuais, [campo]: valor }))} />
            <AlternarVisualizacao modo={modo} onChange={setModo} />
          </div>
        </section>

        {carregando ? (
          <p className="text-text-muted text-sm">Carregando manutenções...</p>
        ) : erro ? (
          <p className="text-danger text-sm" role="alert">
            {erro}
          </p>
        ) : manutencoes.filter((m) => (!filtros.status || m.status === filtros.status) && (!filtros.prioridade || m.prioridade === filtros.prioridade)).length === 0 ? (
          <p className="text-text-muted text-sm">Nenhuma manutenção disponível.</p>
        ) : (
          <div
            className={
              modo === "lista"
                ? "flex flex-col gap-2"
                : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            }
          >
            {manutencoes.filter((m) => (!filtros.status || m.status === filtros.status) && (!filtros.prioridade || m.prioridade === filtros.prioridade)).map((manutencao) => {
              const titulo = manutencao.resumo || "Resumo";
              const abrir = () => navigate(`/manutencoes-totais/${manutencao.id}`);
              const prioridade = (
                <Selo classe={PRIORIDADE_CLASSE[manutencao.prioridade]}>
                  {PRIORIDADE_LABEL[manutencao.prioridade] ?? manutencao.prioridade}
                </Selo>
              );
              const status = (
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
              );

              return modo === "lista" ? (
                <ItemLista
                  key={manutencao.id}
                  titulo={titulo}
                  responsavel={manutencao.responsavel ?? "—"}
                  prioridade={prioridade}
                  status={status}
                  onClick={abrir}
                />
              ) : (
                <Ticket key={manutencao.id} titulo={titulo} onClick={abrir}>
                  <TicketLinha rotulo="Responsável">
                    <span className="font-normal">{manutencao.responsavel ?? "—"}</span>
                  </TicketLinha>
                  <TicketLinha rotulo="Prioridade">{prioridade}</TicketLinha>
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-text mr-1 text-sm font-semibold">Status:</span>
                    {status}
                  </div>
                </Ticket>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
