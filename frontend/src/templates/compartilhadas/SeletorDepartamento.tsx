import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import FecharSelectAoClicarFora from "./FecharSelectAoClicarFora";

export interface OpcaoDepartamento {
  value: string;
  label: string;
}

// Seletor de departamento no mesmo padrão visual do SeletorPrioridade.
// No filtro, use: label={null}, compacto, placeholder e onLimpar.
export default function SeletorDepartamento({
  value,
  onChange,
  opcoes,
  label = "Departamento",
  obrigatorio = false,
  placeholder = "Selecione",
  onLimpar,
  rotuloLimpar = "Todos",
  compacto = false,
}: {
  value: string;
  onChange: (valor: string) => void;
  opcoes: OpcaoDepartamento[];
  label?: string | null; // null = sem rótulo
  obrigatorio?: boolean;
  placeholder?: string;
  onLimpar?: () => void; // quando informado, mostra a opção de limpar
  rotuloLimpar?: string;
  compacto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const atual = opcoes.find((opcao) => opcao.value === value);

  FecharSelectAoClicarFora(containerRef, aberto, () => setAberto(false));

  return (
    <div ref={containerRef}>
      {label !== null && (
        <label className="text-text-muted mb-2 block text-sm font-semibold">
          {label}
          {obrigatorio && (
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
          onClick={() => setAberto((v) => !v)}
          className={`bg-bg border-border hover:border-border-hover flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 transition outline-none ${
            compacto ? "h-9" : "h-11"
          }`}
        >
          <span className={`text-sm ${atual ? "text-text" : "text-text-muted"}`}>
            {atual ? atual.label : placeholder}
          </span>
          <ChevronDown size={18} className="text-text-muted" />
        </button>

        {aberto && (
          <div
            role="listbox"
            className="bg-bg border-border absolute right-0 left-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-lg border p-1.5 shadow-lg"
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
            {opcoes.map((opcao) => (
              <button
                key={opcao.value}
                type="button"
                role="option"
                aria-selected={opcao.value === value}
                onClick={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
                className="text-text hover:bg-bg-tertiary flex w-full cursor-pointer items-center justify-between rounded-md p-1.5 text-sm"
              >
                {opcao.label}
                {opcao.value === value && (
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