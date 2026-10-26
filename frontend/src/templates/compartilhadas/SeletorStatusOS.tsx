import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import type { OrdemStatus } from "@/api";
import { STATUS_CLASSE, STATUS_LABEL } from "./osEstilos";

function obterOpcoes(status: OrdemStatus, responsavelDoTime: boolean): OrdemStatus[] {
  if (status === "review") return responsavelDoTime ? ["teste", "bloqueado"] : [];
  if (status === "bloqueado") return responsavelDoTime ? ["teste"] : [];
  if (status === "concluida") return [];
  const opcoes: OrdemStatus[] = ["aberta", "em andamento", "teste", "review"];
  return opcoes.filter(
    (opcao) => opcao !== status,
  );
}

export default function SeletorStatusOS({
  status,
  responsavelDoTime = false,
  disabled = false,
  onChange,
}: {
  status: OrdemStatus;
  responsavelDoTime?: boolean;
  disabled?: boolean;
  onChange: (status: OrdemStatus) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const opcoes = obterOpcoes(status, responsavelDoTime);

  if (opcoes.length === 0) {
    return (
      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[status]}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  }

  return (
    <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        disabled={disabled}
        onClick={() => setAberto((valor) => !valor)}
        className={`inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition disabled:cursor-wait disabled:opacity-60 ${STATUS_CLASSE[status]}`}
      >
        {STATUS_LABEL[status] ?? status}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {aberto && (
        <div
          role="listbox"
          aria-label="Selecionar status da O.S."
          className="border-border bg-bg absolute top-full left-0 z-20 mt-1 min-w-36 overflow-hidden rounded-lg border p-1 shadow-lg"
        >
          {opcoes.map((opcao) => (
            <button
              key={opcao}
              type="button"
              role="option"
              aria-selected={status === opcao}
              disabled={disabled || status === opcao}
              onClick={() => {
                setAberto(false);
                onChange(opcao);
              }}
              className="text-text hover:bg-primary-muted flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left transition disabled:cursor-default"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSE[opcao]}`}>
                {STATUS_LABEL[opcao]}
              </span>
              {status === opcao && <Check size={15} className="text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
