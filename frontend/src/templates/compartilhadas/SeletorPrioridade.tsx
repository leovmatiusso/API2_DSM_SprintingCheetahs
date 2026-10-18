import { useState } from "react";
import { ChevronDown } from "lucide-react";

import "@/style/NovaOrdemServico.css";

export type PrioridadeValor = "baixa" | "media" | "alta" | "critica";

const OPCOES: { value: PrioridadeValor; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

// Seletor de prioridade com selos coloridos (mesmo visual do projeto)
export default function SeletorPrioridade({
  value,
  onChange,
  label = "Prioridade",
}: {
  value: PrioridadeValor | "";
  onChange: (valor: PrioridadeValor) => void;
  label?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const atual = OPCOES.find((opcao) => opcao.value === value);

  return (
    <div>
      <label className="text-text-muted mb-2 block text-sm font-semibold">
        {label}
        <span className="text-danger ml-0.5 font-light" aria-hidden="true">
          *
        </span>
      </label>

      <div className="relative w-full">
        <button
          type="button"
          className="prioridade-select border-border hover:border-border-hover flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-3 transition outline-none"
          onClick={() => setAberto(!aberto)}
        >
          {atual ? (
            <span className={`badge prioridade-${atual.value}`}>{atual.label}</span>
          ) : (
            <span className="text-text-muted text-sm">Selecione</span>
          )}
          <ChevronDown size={18} className="text-text-muted" />
        </button>

        {aberto && (
          <div className="prioridade-menu border-border absolute right-0 left-0 z-20 mt-1.5 rounded-lg border p-1.5 shadow-lg">
            {OPCOES.map((opcao) => (
              <button
                key={opcao.value}
                type="button"
                onClick={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
                className="hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5"
              >
                <span className={`badge prioridade-${opcao.value}`}>{opcao.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
