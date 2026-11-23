import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { getOrdens } from "@/api";
import type { OrdemServicoResumo } from "@/api";
import { getCurrentUser } from "@/auth";

import OrdemTicket, { CabecalhoListaOS } from "./OrdemTicket";
import AlternarVisualizacao, { useModoVisualizacao } from "./AlternarVisualizacao";
import FiltrosOS, { FILTROS_VAZIOS, aplicarFiltros } from "./FiltrosOS";
import type { FiltrosOrdens } from "./FiltrosOS";

export default function OrdensServico() {
  const currentUser = getCurrentUser();
  const [modo, setModo] = useModoVisualizacao("ordens-disponiveis");
  const [ordens, setOrdens] = useState<OrdemServicoResumo[]>([]);
  const [filtros, setFiltros] = useState<FiltrosOrdens>(FILTROS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const resposta = await getOrdens();
        if (ativo) setOrdens(resposta.ordens);
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as ordens de serviço.",
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

  const ordensFiltradas = aplicarFiltros(ordens, filtros);
  const ordensParaRevisar = ordensFiltradas.filter(
    (os) =>
      os.status === "review" &&
      (os.time?.responsavel_id === currentUser?.id || currentUser?.role === "superusuario"),
  );
  const ordensParaVerificar = ordensFiltradas.filter(
    (os) =>
      os.status === "verificacao" &&
      (currentUser?.role === "monitoramento" || currentUser?.role === "superusuario"),
  );
  const idsEmRevisao = new Set([
    ...ordensParaRevisar.map((os) => os.id),
    ...ordensParaVerificar.map((os) => os.id),
  ]);
  const outrasOrdens = ordensFiltradas.filter((os) => !idsEmRevisao.has(os.id));

  async function recarregarOrdens() {
    try {
      const resposta = await getOrdens();
      setOrdens(resposta.ordens);
    } catch {
      // Mantém os cartões atuais se a atualização da lista falhar.
    }
  }

  // Mesmo formato das O.S. dentro de projetos e manutenções: tickets ou lista com cabeçalho fixo.
  function exibirOrdens(lista: OrdemServicoResumo[]) {
    if (modo === "lista") {
      return (
        <div className="flex flex-col gap-2">
          <CabecalhoListaOS />
          {lista.map((os) => (
            <OrdemTicket key={os.id} os={os} formato="lista" onStatusChange={recarregarOrdens} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {lista.map((os) => (
          <OrdemTicket key={os.id} os={os} onStatusChange={recarregarOrdens} />
        ))}
      </div>
    );
  }

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
                Ordens de serviço
              </h1>
              <p className="text-text-muted mt-1 mb-0 text-sm md:text-base">
                Acompanhe e gerencie as OS
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FiltrosOS ordens={ordens} filtros={filtros} onChange={setFiltros} />
            <AlternarVisualizacao modo={modo} onChange={setModo} />
          </div>
        </section>

        {carregando ? (
          <p className="text-text-muted text-sm">Carregando ordens de serviço...</p>
        ) : erro ? (
          <p className="text-danger text-sm" role="alert">
            {erro}
          </p>
        ) : ordens.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhuma ordem de serviço disponível.</p>
        ) : ordensFiltradas.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhuma ordem de serviço encontrada com os filtros selecionados.
          </p>
        ) : (
          <div className="space-y-9">
            {ordensParaVerificar.length > 0 && (
              <section aria-labelledby="ordens-para-verificar">
                <div className="mb-4 flex items-center gap-3">
                  <h2 id="ordens-para-verificar" className="text-text m-0 text-lg font-bold">
                    OS aguardando verificação
                  </h2>
                  <span className="bg-laranja-alt text-laranja-alt-inverted rounded-full px-2 py-0.5 text-xs font-semibold">
                    {ordensParaVerificar.length}
                  </span>
                </div>
                {exibirOrdens(ordensParaVerificar)}
              </section>
            )}

            {ordensParaRevisar.length > 0 && (
              <section aria-labelledby="ordens-para-revisar">
                <div className="mb-4 flex items-center gap-3">
                  <h2 id="ordens-para-revisar" className="text-text m-0 text-lg font-bold">
                    OS a serem revisadas
                  </h2>
                  <span className="bg-warning-alt text-warning-alt-inverted rounded-full px-2 py-0.5 text-xs font-semibold">
                    {ordensParaRevisar.length}
                  </span>
                </div>
                {exibirOrdens(ordensParaRevisar)}
              </section>
            )}

            {outrasOrdens.length > 0 && (
              <section aria-labelledby="ordens-disponiveis">
                {ordensParaRevisar.length > 0 && (
                  <h2 id="ordens-disponiveis" className="text-text mb-4 mt-0 text-lg font-bold">
                    Outras OS disponíveis
                  </h2>
                )}
                {exibirOrdens(outrasOrdens)}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
