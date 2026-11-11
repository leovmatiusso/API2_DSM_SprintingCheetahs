import { useEffect, useRef, useState } from "react";
import { ListFilter } from "lucide-react";

import type { OrdemStatus } from "@/api";
import Button from "@/components/ui/Button";

import { STATUS_LABEL } from "./osEstilos";
import SeletorDepartamento, {
  type OpcaoDepartamento,
} from "./SeletorDepartamento";
import SeletorPrioridade, {
  OPCOES_PRIORIDADE,
  type PrioridadeValor,
} from "./SeletorPrioridade";
import SeletorStatusOSFiltro from "./SeletorStatusOSFiltro";

export interface FiltrosOS {
  departamento: string;
  prioridade: PrioridadeValor | "";
  status: OrdemStatus | "";
}

export const FILTROS_VAZIOS: FiltrosOS = {
  departamento: "",
  prioridade: "",
  status: "",
};

interface FiltroOSProps {
  filtros: FiltrosOS;
  onApply: (filtros: FiltrosOS) => void;
  departamentos: OpcaoDepartamento[];
}

export default function FiltroOS({
  filtros,
  onApply,
  departamentos,
}: FiltroOSProps) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltrosOS>(filtros);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o painel ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;

    const onClickFora = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", onClickFora);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickFora);
      document.removeEventListener("keydown", onEsc);
    };
  }, [aberto]);

  const alternar = () => {
    // ao abrir o rascunho começa igual aos filtros já aplicados
    if (!aberto) setRascunho(filtros);
    setAberto((v) => !v);
  };

  const aplicar = () => {
    onApply(rascunho);
    setAberto(false);
  };

  const limpar = () => {
    setRascunho(FILTROS_VAZIOS);
    onApply(FILTROS_VAZIOS);
    setAberto(false);
  };

  // Chips dos filtros ativos (mostram o label da opção escolhida)
  const chips: { chave: keyof FiltrosOS; label: string }[] = [];

  if (filtros.departamento) {
    chips.push({
      chave: "departamento",
      label:
        departamentos.find((d) => d.value === filtros.departamento)?.label ??
        filtros.departamento,
    });
  }
  if (filtros.prioridade) {
    chips.push({
      chave: "prioridade",
      label:
        OPCOES_PRIORIDADE.find((p) => p.value === filtros.prioridade)?.label ??
        filtros.prioridade,
    });
  }
  if (filtros.status) {
    chips.push({
      chave: "status",
      label: STATUS_LABEL[filtros.status] ?? filtros.status,
    });
  }

  // Clicar no chip remove aquele filtro
  const removerFiltro = (chave: keyof FiltrosOS) => {
    onApply({ ...filtros, [chave]: "" });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {chips.map((chip) => (
        <Button
          key={chip.chave}
          variant="filter"
          onClick={() => removerFiltro(chip.chave)}
        >
          {chip.label}
        </Button>
      ))}

      <div ref={containerRef} className="relative">
        <Button variant="filter" onClick={alternar}>
          <span className="flex items-center gap-2">
            <ListFilter size={18} />
            Filtrar
          </span>
        </Button>

        {aberto && (
          <div className="bg-bg border-border absolute top-full right-0 z-20 mt-2 w-max rounded-xl border p-4 shadow-lg">
            <div className="flex flex-wrap gap-3">
              <div className="w-40">
                <SeletorDepartamento
                  label={null}
                  compacto
                  placeholder="Departamento"
                  opcoes={departamentos}
                  value={rascunho.departamento}
                  onChange={(v) =>
                    setRascunho((r) => ({ ...r, departamento: v }))
                  }
                  onLimpar={() =>
                    setRascunho((r) => ({ ...r, departamento: "" }))
                  }
                />
              </div>

              <div className="w-40">
                <SeletorPrioridade
                  label={null}
                  compacto
                  placeholder="Prioridade"
                  value={rascunho.prioridade}
                  onChange={(v) => setRascunho((r) => ({ ...r, prioridade: v }))}
                  onLimpar={() =>
                    setRascunho((r) => ({ ...r, prioridade: "" }))
                  }
                />
              </div>

              <div className="w-40">
                <SeletorStatusOSFiltro
                  placeholder="Status"
                  value={rascunho.status}
                  onChange={(v) => setRascunho((r) => ({ ...r, status: v }))}
                  onLimpar={() => setRascunho((r) => ({ ...r, status: "" }))}
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <Button variant="filter" size="sm" onClick={limpar}>
                Limpar filtros
              </Button>
              <Button variant="filter" size="sm" onClick={aplicar}>
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}