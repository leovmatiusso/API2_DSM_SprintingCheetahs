import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import { getCurrentUser } from "@/auth";
import { getProjetos } from "@/api";
import type { ProjetoResumo } from "@/api";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
} from "./osEstilos";
import SeletorStatusProjeto from "./SeletorStatusProjeto";

export default function Projetos() {
  const navigate = useNavigate();
  const podeAlterarStatus = getCurrentUser()?.role === "comercial";

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
        <section className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold md:text-[32px]">
              Projetos
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
              Acompanhe e gerencie todos os projetos
            </p>
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {projetos.map((projeto) => (
              <Ticket
                key={projeto.id}
                titulo={projeto.nome}
                onClick={() => navigate(`/projetos-totais/${projeto.id}`)}
              >
                <TicketLinha rotulo="Responsável">
                  <span className="font-normal">{projeto.responsavel ?? "—"}</span>
                </TicketLinha>
                <TicketLinha rotulo="Prioridade">
                  <Selo classe={PRIORIDADE_CLASSE[projeto.prioridade]}>
                    {PRIORIDADE_LABEL[projeto.prioridade] ?? projeto.prioridade}
                  </Selo>
                </TicketLinha>
                <TicketLinha rotulo="Status">
                  <SeletorStatusProjeto projetoId={projeto.id} projetoNome={projeto.nome} status={projeto.status} podeAlterar={podeAlterarStatus} onStatusChange={(status) => {
                    setProjetos((atuais) => atuais.map((item) => item.id === projeto.id ? { ...item, status } : item));
                  }} />
                </TicketLinha>
              </Ticket>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
