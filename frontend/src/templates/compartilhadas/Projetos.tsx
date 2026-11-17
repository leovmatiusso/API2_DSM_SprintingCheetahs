import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import { getCurrentUser } from "@/auth";
import { getProjetos } from "@/api";
import type { ProjetoResumo } from "@/api";

import { ItemLista, Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
} from "./osEstilos";
import SeletorStatusProjeto from "./SeletorStatusProjeto";
import AlternarVisualizacao, { useModoVisualizacao } from "./AlternarVisualizacao";

export default function Projetos() {
  const navigate = useNavigate();
  const [modo, setModo] = useModoVisualizacao("projetos");
  // Todos que veem projetos mudam o status; a opção "Concluído" é limitada no seletor.
  const podeAlterarStatus = getCurrentUser()?.role !== "suporte";

  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await getProjetos();
        if (ativo) setProjetos(resposta.projetos);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os projetos.",
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
              <ClipboardList size={32} />
            </div>
            <div>
              <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
                Projetos
              </h1>
              <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
                Acompanhe e gerencie todos os projetos
              </p>
            </div>
          </div>
          <AlternarVisualizacao modo={modo} onChange={setModo} />
        </section>

        {carregando ? (
          <p className="text-text-muted text-sm">Carregando projetos...</p>
        ) : erro ? (
          <p className="text-danger text-sm" role="alert">
            {erro}
          </p>
        ) : projetos.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhum projeto disponível.</p>
        ) : (
          <div
            className={
              modo === "lista"
                ? "flex flex-col gap-2"
                : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            }
          >
            {projetos.map((projeto) => {
              const abrir = () => navigate(`/projetos-totais/${projeto.id}`);
              const prioridade = (
                <Selo classe={PRIORIDADE_CLASSE[projeto.prioridade]}>
                  {PRIORIDADE_LABEL[projeto.prioridade] ?? projeto.prioridade}
                </Selo>
              );
              const status = (
                <SeletorStatusProjeto
                  projetoId={projeto.id}
                  projetoNome={projeto.nome}
                  status={projeto.status}
                  podeAlterar={podeAlterarStatus}
                  onStatusChange={(status) => {
                    setProjetos((atuais) => atuais.map((item) => item.id === projeto.id ? { ...item, status } : item));
                  }}
                />
              );

              return modo === "lista" ? (
                <ItemLista
                  key={projeto.id}
                  titulo={projeto.nome}
                  responsavel={projeto.responsavel ?? "—"}
                  prioridade={prioridade}
                  status={status}
                  onClick={abrir}
                />
              ) : (
                <Ticket key={projeto.id} titulo={projeto.nome} onClick={abrir}>
                  <TicketLinha rotulo="Responsável">
                    <span className="font-normal">{projeto.responsavel ?? "—"}</span>
                  </TicketLinha>
                  <TicketLinha rotulo="Prioridade">{prioridade}</TicketLinha>
                  <TicketLinha rotulo="Status">{status}</TicketLinha>
                </Ticket>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
