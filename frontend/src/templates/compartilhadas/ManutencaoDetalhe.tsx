import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ChartNoAxesCombined,
  ClipboardList,
  UserRoundCog,
  Wrench,
} from "lucide-react";

import { abrirAnexoManutencao, getManutencao } from "@/api";
import type { Manutencao, ManutencaoAnexo } from "@/api";
import Button from "@/components/ui/Button";

import DetalhePainel from "./DetalhePainel";
import OrdensDoItem from "./OrdensDoItem";
import { PRIORIDADE_LABEL, formatarData } from "./osEstilos";

const TIPOS: Record<Manutencao["tipo_manutencao"], string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  adaptativa: "Adaptativa",
  evolutiva: "Evolutiva",
};

export default function ManutencaoDetalhe() {
  const { manutencaoId } = useParams<{ manutencaoId: string }>();
  const navigate = useNavigate();

  const [manutencao, setManutencao] = useState<Manutencao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!manutencaoId) return;
      try {
        const resposta = await getManutencao(manutencaoId);
        if (ativo) setManutencao(resposta.manutencao);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a manutenção.",
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
  }, [manutencaoId]);

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        {carregando ? (
          <p className="text-text-muted text-sm">Carregando manutenção...</p>
        ) : erro || !manutencao ? (
          <div>
            <p className="text-danger mb-4 text-sm" role="alert">
              {erro ?? "Manutenção não encontrada."}
            </p>
            <Button variant="outline" onClick={() => navigate("/manutencoes-totais")}>
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
                    Resumo da Manutenção
                  </h1>
                  <p className="text-text-muted mt-1 mb-0 text-sm">
                    {manutencao.resumo || "Veja os detalhes"}
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={() => navigate("/manutencoes-totais")}>
                Voltar
              </Button>
            </div>

            <DetalhePainel
              campos={[
                {
                  icone: UserRoundCog,
                  rotulo: "Responsável",
                  valor: manutencao.responsavel ?? "—",
                },
                {
                  icone: Calendar,
                  rotulo: "Data de início do problema",
                  valor: formatarData(manutencao.data_inicio_problema),
                },
                {
                  icone: Calendar,
                  rotulo: "Data limite",
                  valor: formatarData(manutencao.data_limite),
                },
                {
                  icone: ClipboardList,
                  rotulo: "Projeto",
                  valor: manutencao.projeto?.nome ?? "—",
                },
                {
                  icone: Wrench,
                  rotulo: "Tipo de manutenção",
                  valor: TIPOS[manutencao.tipo_manutencao] ?? manutencao.tipo_manutencao,
                },
                {
                  icone: ChartNoAxesCombined,
                  rotulo: "Prioridade",
                  valor: PRIORIDADE_LABEL[manutencao.prioridade] ?? manutencao.prioridade,
                },
              ]}
              descricao={manutencao.descricao}
              equipamentos={manutencao.equipamentos}
              anexos={manutencao.anexos}
              abrirAnexo={(anexo: ManutencaoAnexo) =>
                abrirAnexoManutencao(manutencao.id, anexo)
              }
            />

            <OrdensDoItem
              ordens={manutencao.ordens}
              novaOsPath={`/os/nova-os?manutencao=${manutencao.id}`}
            />
          </>
        )}
      </div>
    </main>
  );
}
