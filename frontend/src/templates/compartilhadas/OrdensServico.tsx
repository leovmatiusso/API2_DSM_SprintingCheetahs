import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { getOrdens } from "@/api";
import type { OrdemServicoResumo } from "@/api";

import OrdemTicket from "./OrdemTicket";

export default function OrdensServico() {
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ordens.map((os) => (
              <OrdemTicket key={os.id} os={os} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}