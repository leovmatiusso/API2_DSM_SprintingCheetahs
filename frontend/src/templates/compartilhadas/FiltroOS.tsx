import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ListFilter } from "lucide-react";

import type { OrdemServicoResumo, OrdemStatus } from "@/api";
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
  atrasadas: boolean;
}

export const FILTROS_VAZIOS: FiltrosOS = {
  departamento: "",
  prioridade: "",
  status: "",
  atrasadas: false,
};

// Remove acentos, maiúsculas e espaços para comparar textos como
// "Produção" e "producao" como iguais
const normalizar = (valor?: string | null) =>
  (valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Aplica os filtros escolhidos a uma lista de O.S
// Usada nas páginas OrdensServico e OrdensDoItem
export function aplicarFiltros(
  ordens: OrdemServicoResumo[],
  filtros: FiltrosOS,
) {
  return ordens.filter(
    (os) =>
      (!filtros.departamento ||
        normalizar(os.departamento) === normalizar(filtros.departamento)) &&
      (!filtros.prioridade || os.prioridade === filtros.prioridade) &&
      (!filtros.status || os.status === filtros.status),
  );
}

interface FiltroOSProps {
  filtros: FiltrosOS;
  onApply: (filtros: FiltrosOS) => void;
  departamentos: OpcaoDepartamento[];
}

// Estilo do chip/botão "Atrasadas" (vermelho, como no mockup)
const estiloAtrasada =
  "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium " +
  "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500";

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
    // ao abrir, o rascunho começa igual aos filtros já aplicados
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

  if (filtros.atrasadas) {
    chips.push({ chave: "atrasadas", label: "Atrasada" });
  }
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
    onApply({
      ...filtros,
      [chave]: chave === "atrasadas" ? false : "",
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {chips.map((chip) =>
        chip.chave === "atrasadas" ? (
          <button
            key={chip.chave}
            type="button"
            onClick={() => removerFiltro(chip.chave)}
            aria-label="Remover filtro de atrasadas"
            className={`${estiloAtrasada} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}
          >
            <AlertTriangle aria-hidden size={16} />
            {chip.label}
          </button>
        ) : (
          <Button
            key={chip.chave}
            variant="filter"
            onClick={() => removerFiltro(chip.chave)}
          >
            {chip.label}
          </Button>
        ),
      )}

      <div ref={containerRef} className="relative">
        <Button variant="filter" onClick={alternar}>
          <span className="flex items-center gap-2">
            <ListFilter size={18} />
            Filtrar
          </span>
        </Button>

        {aberto && (
          // mobile: bottom sheet fixo · desktop (sm+): popover ancorado no botão
          <div
            className="bg-bg border-border fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border p-4 shadow-lg
                       sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-2 sm:w-max sm:rounded-xl"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="w-full sm:w-40">
                <SeletorDepartamento
                  label={null}
                  compacto
                  placeholder="Departamento"
                  opcoes={departamentos}
                  value={rascunho.departamento}
                  onChange={(v: string) =>
                    setRascunho((r) => ({ ...r, departamento: v }))
                  }
                  onLimpar={() =>
                    setRascunho((r) => ({ ...r, departamento: "" }))
                  }
                />
              </div>

              <div className="w-full sm:w-40">
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

              <div className="w-full sm:w-40">
                <SeletorStatusOSFiltro
                  placeholder="Status"
                  value={rascunho.status}
                  onChange={(v) => setRascunho((r) => ({ ...r, status: v }))}
                  onLimpar={() => setRascunho((r) => ({ ...r, status: "" }))}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={rascunho.atrasadas}
                onClick={() =>
                  setRascunho((r) => ({ ...r, atrasadas: !r.atrasadas }))
                }
                className={`${estiloAtrasada} ${
                  rascunho.atrasadas
                    ? "border-red-500 bg-red-100 text-red-800 ring-1 ring-red-400"
                    : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                <AlertTriangle aria-hidden size={16} />
                Atrasadas
                {rascunho.atrasadas && <Check aria-hidden size={16} />}
              </button>

              <div className="ml-auto flex gap-2">
                <Button variant="filter" size="sm" onClick={limpar}>
                  Limpar filtros
                </Button>
                <Button variant="filter" size="sm" onClick={aplicar}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
