import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";

import { getOrdens } from "@/api";
import type { OrdemServicoResumo } from "@/api";
import Button from "@/components/ui/Button";

import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  STATUS_CLASSE,
  STATUS_LABEL,
} from "./osEstilos";

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <p className="text-text m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold">{rotulo}:</span>
      {children}
    </p>
  );
}

export default function OrdensServico() {
  const navigate = useNavigate();

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
          <div className="grid grid-cols-1 gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-4">
            {ordens.map((os) => (
              <button
                key={os.id}
                type="button"
                onClick={() => navigate(`/os/disponiveis/${os.id}`)}
                className="nova-os-card border-border cursor-pointer rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-text border-border m-0 mb-2 border-b pb-2 text-xl leading-tight font-bold break-words">
                  {os.titulo}
                </h3>

                <Linha rotulo="Time">
                  <span className="font-normal">{os.time?.nome ?? "—"}</span>
                </Linha>
                <Linha rotulo="Departamento">
                  <span className="font-normal">{os.departamento ?? "—"}</span>
                </Linha>
                <Linha rotulo="Prioridade">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORIDADE_CLASSE[os.prioridade]}`}
                  >
                    {PRIORIDADE_LABEL[os.prioridade] ?? os.prioridade}
                  </span>
                </Linha>
                <Linha rotulo="Status">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[os.status]}`}
                  >
                    {STATUS_LABEL[os.status] ?? os.status}
                  </span>
                </Linha>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed right-6 bottom-6 z-30 shadow-lg">
        <Button size="lg" onClick={() => navigate("/os/nova-os")}>
          <span className="flex items-center gap-2">
            <Plus size={18} />
            Nova OS
          </span>
        </Button>
      </div>
    </main>
  );
}