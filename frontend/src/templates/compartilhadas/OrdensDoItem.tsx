import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";

import type { OrdemServicoResumo } from "@/api";
import Button from "@/components/ui/Button";

import FiltroOS, { FILTROS_VAZIOS, type FiltrosOS } from "./FiltroOS";
import OrdemTicket from "./OrdemTicket";

// Seção "Ordens de serviço" exibida abaixo do projeto/manutenção expandido:
// botão "Nova O.S." (única forma de criar O.S.) + tickets das O.S. já criadas.
export default function OrdensDoItem({
  ordens,
  novaOsPath,
}: {
  ordens: OrdemServicoResumo[];
  novaOsPath: string;
}) {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<FiltrosOS>(FILTROS_VAZIOS);

  // Ajuste os nomes dos campos (departamento, prioridade, status)
  // conforme o tipo real de OrdemServicoResumo
  const ordensFiltradas = useMemo(
    () =>
      ordens.filter(
        (os) =>
          (!filtros.departamento || os.departamento === filtros.departamento) &&
          (!filtros.prioridade || os.prioridade === filtros.prioridade) &&
          (!filtros.status || os.status === filtros.status),
      ),
    [ordens, filtros],
  );

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex items-center gap-3">
          {/* BOTÃO + PAINEL DE FILTRAGEM DE OS */}
          <FiltroOS
            filtros={filtros}
            onApply={setFiltros}
            departamentos={[
              { value: "producao", label: "Produção" },
              { value: "software", label: "Software" },
              { value: "monitoramento", label: "Monitoramento" },
              { value: "implantacao", label: "Implantação" },
            ]}
          />

          <Button onClick={() => navigate(novaOsPath)}>
            <span className="flex items-center gap-2">
              <Plus size={18} />
              Nova O.S.
            </span>
          </Button>
        </div>
      </div>

      {ordensFiltradas.length === 0 ? (
        <p className="text-text-muted text-sm">
          {ordens.length === 0
            ? "Nenhuma ordem de serviço criada até o momento."
            : "Nenhuma O.S. encontrada com esses filtros."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ordensFiltradas.map((os) => (
            <OrdemTicket key={os.id} os={os} />
          ))}
        </div>
      )}
    </section>
  );
}