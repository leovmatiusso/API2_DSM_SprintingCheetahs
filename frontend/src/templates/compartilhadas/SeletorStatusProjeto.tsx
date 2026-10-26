import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { atualizarStatusProjeto } from "@/api";
import type { StatusProjeto } from "@/api";

import { STATUS_PROJETO_CLASSE, STATUS_PROJETO_LABEL } from "./osEstilos";

export default function SeletorStatusProjeto({
  projetoId,
  projetoNome,
  status,
  podeAlterar,
  onStatusChange,
}: {
  projetoId: string;
  projetoNome: string;
  status: StatusProjeto;
  podeAlterar: boolean;
  onStatusChange: (status: StatusProjeto) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterarStatus(novoStatus: StatusProjeto) {
    const statusAnterior = status;
    setAberto(false);
    onStatusChange(novoStatus);
    setSalvando(true);
    setErro(null);
    try {
      await atualizarStatusProjeto(projetoId, novoStatus);
    } catch (error) {
      onStatusChange(statusAnterior);
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o status do projeto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <span className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`Status do projeto ${projetoNome}`}
        disabled={!podeAlterar || salvando}
        onClick={() => setAberto((valor) => !valor)}
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition disabled:cursor-default disabled:opacity-75 ${STATUS_PROJETO_CLASSE[status]}`}
      >
        {salvando ? "Salvando..." : STATUS_PROJETO_LABEL[status]}
        {podeAlterar && <ChevronDown size={14} aria-hidden="true" />}
      </button>
      {aberto && (
        <span
          role="listbox"
          aria-label="Selecionar status do projeto"
          className="border-border bg-bg absolute top-full left-0 z-20 mt-1 min-w-36 overflow-hidden rounded-lg border p-1 shadow-lg"
        >
          {(Object.keys(STATUS_PROJETO_LABEL) as StatusProjeto[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              role="option"
              aria-selected={status === opcao}
              disabled={salvando || status === opcao}
              onClick={() => void alterarStatus(opcao)}
              className="text-text hover:bg-primary-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition disabled:cursor-default"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_PROJETO_CLASSE[opcao]}`}>
                {STATUS_PROJETO_LABEL[opcao]}
              </span>
              {status === opcao && <Check size={15} className="text-primary" aria-hidden="true" />}
            </button>
          ))}
        </span>
      )}
      {erro && <span className="text-danger absolute top-full left-0 z-30 mt-1 w-56 rounded bg-bg p-2 text-xs shadow" role="alert">{erro}</span>}
    </span>
  );
}
