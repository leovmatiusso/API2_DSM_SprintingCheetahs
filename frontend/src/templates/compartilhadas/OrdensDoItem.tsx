import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";

import type { OrdemServicoResumo } from "@/api";
import Button from "@/components/ui/Button";

import OrdemTicket, { CabecalhoListaOS } from "./OrdemTicket";
import AlternarVisualizacao, { useModoVisualizacao } from "./AlternarVisualizacao";
import FiltrosOS, { FILTROS_VAZIOS, aplicarFiltros } from "./FiltrosOS";
import type { FiltrosOrdens } from "./FiltrosOS";

// Seção "Ordens de serviço" exibida abaixo do projeto/manutenção expandido:
// botão "Nova O.S." (única forma de criar O.S.) + O.S. já criadas, em tickets ou em lista,
// com filtros por departamento, prioridade, status e atrasadas.
export default function OrdensDoItem({
  ordens,
  novaOsPath,
}: {
  ordens: OrdemServicoResumo[];
  novaOsPath: string;
}) {
  const navigate = useNavigate();
  const [modo, setModo] = useModoVisualizacao("ordens-do-item");
  const [filtros, setFiltros] = useState<FiltrosOrdens>(FILTROS_VAZIOS);
  // Cópia local para os filtros enxergarem o status alterado direto no seletor.
  const [lista, setLista] = useState(ordens);

  useEffect(() => {
    setLista(ordens);
  }, [ordens]);

  function atualizarStatus(id: string, status: OrdemServicoResumo["status"]) {
    setLista((atuais) => atuais.map((os) => (os.id === id ? { ...os, status } : os)));
  }

  const filtradas = aplicarFiltros(lista, filtros);

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary-muted text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-text m-0 text-xl leading-tight font-bold">
              Ordens de serviço
            </h2>
            <p className="text-text-muted mt-1 mb-0 text-sm">
              Acompanhe e gerencie as OS
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
          {lista.length > 0 && <FiltrosOS ordens={lista} filtros={filtros} onChange={setFiltros} />}
          <AlternarVisualizacao modo={modo} onChange={setModo} />
          <Button onClick={() => navigate(novaOsPath)}>
            <span className="flex items-center gap-2">
              <Plus size={18} />
              Nova O.S.
            </span>
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nenhuma ordem de serviço criada até o momento.
        </p>
      ) : filtradas.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nenhuma ordem de serviço encontrada com os filtros selecionados.
        </p>
      ) : modo === "lista" ? (
        <div className="flex flex-col gap-2">
          <CabecalhoListaOS />
          {filtradas.map((os) => (
            <OrdemTicket
              key={os.id}
              os={os}
              formato="lista"
              onStatusChange={(status) => atualizarStatus(os.id, status)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtradas.map((os) => (
            <OrdemTicket
              key={os.id}
              os={os}
              onStatusChange={(status) => atualizarStatus(os.id, status)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
