import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import type { OrdemStatus } from "@/api";

import { STATUS_CLASSE, STATUS_LABEL } from "./osEstilos";
import FecharSelectAoClicarFora from "./FecharSelectAoClicarFora";


//SELETOR PARA STATUS DE OS DO FILTRO(DIFERENTE DO SeletorStatusOS)

// Todos os status possíveis, lidos direto do mapa labels
const TODOS_STATUS = Object.keys(STATUS_LABEL) as OrdemStatus[];

export default function SeletorStatusOSFiltro({
  value,
  onChange,
  onLimpar,
  label = null,
  placeholder = "Status",
  rotuloLimpar = "Todos",
  compacto = true,
}: {
  value: OrdemStatus | "";
  onChange: (status: OrdemStatus) => void;
  onLimpar?: () => void;
  label?: string | null;
  placeholder?: string;
  rotuloLimpar?: string;
  compacto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  FecharSelectAoClicarFora(containerRef, aberto, () => setAberto(false));

  return (
    <div ref={containerRef}>
      {label !== null && (
        <label className="text-text-muted mb-2 block text-sm font-semibold">
          {label}
        </label>
      )}

      <div className="relative w-full">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className={`bg-bg border-border hover:border-border-hover flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 transition outline-none ${
            compacto ? "h-9" : "h-11"
          }`}
        >
          {value ? (
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[value]}`}
            >
              {STATUS_LABEL[value] ?? value}
            </span>
          ) : (
            <span className="text-text-muted text-sm">{placeholder}</span>
          )}
          <ChevronDown size={18} className="text-text-muted" />
        </button>

        {aberto && (
          <div
            role="listbox"
            aria-label="Filtrar por status da O.S."
            className="bg-bg border-border absolute right-0 left-0 z-30 mt-1.5 rounded-lg border p-1.5 shadow-lg"
          >
            {onLimpar && (
              <button
                type="button"
                onClick={() => {
                  onLimpar();
                  setAberto(false);
                }}
                className="text-text-muted hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5 text-sm"
              >
                {rotuloLimpar}
              </button>
            )}
            {TODOS_STATUS.map((status) => (
              <button
                key={status}
                type="button"
                role="option"
                aria-selected={status === value}
                onClick={() => {
                  onChange(status);
                  setAberto(false);
                }}
                className="hover:bg-bg-tertiary flex w-full cursor-pointer items-center justify-between rounded-md p-1.5"
              >
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
                {status === value && (
                  <Check size={15} className="text-primary" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}