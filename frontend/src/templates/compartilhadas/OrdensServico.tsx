import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { getOrdens } from "@/api";
import type { OrdemServicoResumo } from "@/api";
import { getCurrentUser } from "@/auth";

import OrdemTicket from "./OrdemTicket";

export default function OrdensServico() {
  const currentUser = getCurrentUser();
  const [ordens, setOrdens] = useState<OrdemServicoResumo[]>([]);
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

  const ordensParaRevisar = ordens.filter(
    (os) => os.status === "review" && os.time?.responsavel_id === currentUser?.id,
  );
  const idsEmRevisao = new Set(ordensParaRevisar.map((os) => os.id));
  const outrasOrdens = ordens.filter((os) => !idsEmRevisao.has(os.id));

  async function recarregarOrdens() {
    try {
      const resposta = await getOrdens();
      setOrdens(resposta.ordens);
    } catch {
      // Mantém os cartões atuais se a atualização da lista falhar.
    }
  }

  return (
    <main className="page min-h-full p-5 md:p-8">
      <div className="mx-auto w-full max-w-[1320px]">
        <section className="mb-8 flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-text m-0 text-2xl leading-tight font-bold">
              Ordens de serviço
            </h1>
            <p className="text-text-muted mt-1 mb-0 text-sm">
              Acompanhe e gerencie as OS
            </p>
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
        ) : (
          <div className="space-y-9">
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {ordensParaRevisar.map((os) => (
                    <OrdemTicket key={os.id} os={os} onStatusChange={recarregarOrdens} />
                  ))}
                </div>
              </section>
            )}

            {outrasOrdens.length > 0 && (
              <section aria-labelledby="ordens-disponiveis">
                {ordensParaRevisar.length > 0 && (
                  <h2 id="ordens-disponiveis" className="text-text mb-4 mt-0 text-lg font-bold">
                    Outras OS disponíveis
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {outrasOrdens.map((os) => (
                    <OrdemTicket key={os.id} os={os} onStatusChange={recarregarOrdens} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
