import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "@/style/NovaOrdemServico.css";
import FecharSelectAoClicarFora from "./FecharSelectAoClicarFora";

export type PrioridadeValor = "baixa" | "media" | "alta" | "critica";
export const OPCOES_PRIORIDADE: { value: PrioridadeValor; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export default function SeletorPrioridade({
  value,
  onChange,
  label = "Prioridade",
  compacto = false,
  placeholder = "Selecione",
  onLimpar,
}: {
  value: PrioridadeValor | "";
  onChange: (valor: PrioridadeValor) => void;
  label?: string | null;
  compacto?: boolean;
  placeholder?: string;
  onLimpar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const atual = OPCOES_PRIORIDADE.find((opcao) => opcao.value === value);
  FecharSelectAoClicarFora(containerRef, aberto, () => setAberto(false));
  return (
    <div ref={containerRef}>
      {label !== null && (
        <label className="text-text-muted mb-2 block text-sm font-semibold">
          {label}
          {!compacto && (
            <span className="text-danger ml-0.5 font-light" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative w-full">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={aberto}
          className={`prioridade-select border-border hover:border-border-hover flex w-full cursor-pointer items-center justify-between rounded-lg border px-2 transition outline-none ${compacto ? "h-9" : "h-11"}`}
          onClick={() => setAberto((v) => !v)}
        >
          {atual ? (
            <span className={`badge prioridade-${atual.value}`}>{atual.label}</span>
          ) : (
            <span className="text-text-muted text-sm">{placeholder}</span>
          )}
          <ChevronDown size={18} className="text-text-muted" />
        </button>
        {aberto && (
          <div
            role="listbox"
            className="prioridade-menu border-border absolute right-0 left-0 z-30 mt-1.5 rounded-lg border p-1.5 shadow-lg"
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
                Todas
              </button>
            )}
            {OPCOES_PRIORIDADE.map((opcao) => (
              <button
                key={opcao.value}
                type="button"
                role="option"
                aria-selected={opcao.value === value}
                onClick={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
                className="hover:bg-bg-tertiary flex w-full cursor-pointer items-center justify-between rounded-md p-1.5"
              >
                <span className={`badge prioridade-${opcao.value}`}>{opcao.label}</span>
                {opcao.value === value && <Check size={15} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
