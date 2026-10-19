import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChartNoAxesCombined,
  ClipboardList,
  FileSignature,
  MonitorCog,
  ScrollText,
  UserRound,
  UserRoundCog,
} from "lucide-react";

import { abrirAnexoProjeto, getProjeto } from "@/api";
import type { Projeto, ProjetoAnexo } from "@/api";
import Button from "@/components/ui/Button";

import DetalhePainel from "./DetalhePainel";
import OrdensDoItem from "./OrdensDoItem";
import { PRIORIDADE_LABEL, formatarData } from "./osEstilos";

export default function ProjetoDetalhe() {
  const { projetoId } = useParams<{ projetoId: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!projetoId) return;
      try {
        const resposta = await getProjeto(projetoId);
        if (ativo) setProjeto(resposta.projeto);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o projeto.",
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
  }, [projetoId]);

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {carregando ? (
          <p className="text-text-muted text-sm">Carregando projeto...</p>
        ) : erro || !projeto ? (
          <div>
            <p className="text-danger mb-4 text-sm" role="alert">
              {erro ?? "Projeto não encontrado."}
            </p>
            <Button variant="outline" onClick={() => navigate("/projetos-totais")}>
              Voltar
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
                  <ClipboardList size={28} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-text m-0 text-2xl leading-tight font-bold break-words md:text-[32px]">
                    {projeto.nome}
                  </h1>
                  <p className="text-text-muted mt-1 mb-0 text-sm">
                    Veja os detalhes e acompanhe as OS
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={() => navigate("/projetos-totais")}>
                Voltar
              </Button>
            </div>

            <DetalhePainel
              campos={[
                {
                  icone: UserRoundCog,
                  rotulo: "Responsável",
                  valor: projeto.responsavel ?? "—",
                },
                {
                  icone: FileSignature,
                  rotulo: "Data de assinatura do contrato",
                  valor: formatarData(projeto.data_assinatura_contrato),
                },
                {
                  icone: UserRound,
                  rotulo: "Vendedor",
                  valor: projeto.vendedor ?? "—",
                },
                {
                  icone: ScrollText,
                  rotulo: "Data de vencimento do contrato",
                  valor: formatarData(projeto.data_vencimento_contrato),
                },
                {
                  icone: Calendar,
                  rotulo: "Data limite",
                  valor: formatarData(projeto.data_limite),
                },
                {
                  icone: MonitorCog,
                  rotulo: "Tipo do sistema",
                  valor: projeto.tipo_sistema,
                },
                {
                  icone: ChartNoAxesCombined,
                  rotulo: "Prioridade",
                  valor: PRIORIDADE_LABEL[projeto.prioridade] ?? projeto.prioridade,
                },
              ]}
              descricao={projeto.descricao}
              equipamentos={projeto.equipamentos}
              anexos={projeto.anexos}
              abrirAnexo={(anexo: ProjetoAnexo) => abrirAnexoProjeto(projeto.id, anexo)}
            />

            <OrdensDoItem
              ordens={projeto.ordens}
              novaOsPath={`/os/nova-os?projeto=${projeto.id}`}
            />
          </>
        )}
      </div>
    </main>
  );
}
