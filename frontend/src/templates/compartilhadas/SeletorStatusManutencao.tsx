import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { atualizarManutencao } from "@/api";

export type StatusManutencaoValor = "aberta" | "em_andamento" | "concluida" | "cancelada";

export const STATUS_MANUTENCAO_LABEL: Record<StatusManutencaoValor, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_MANUTENCAO_CLASSE: Record<StatusManutencaoValor, string> = {
  aberta: "bg-bg-tertiary text-text-muted",
  em_andamento: "bg-primary-muted text-primary",
  concluida: "bg-success-alt text-success-alt-inverted",
  cancelada: "bg-danger-alt text-danger-alt-inverted",
};

export default function SeletorStatusManutencao({
  manutencaoId,
  manutencaoResumo,
  status,
  onStatusChange,
}: {
  manutencaoId: string;
  manutencaoResumo: string;
  status: StatusManutencaoValor;
  onStatusChange: (status: StatusManutencaoValor) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterarStatus(novoStatus: StatusManutencaoValor) {
    const statusAnterior = status;
    setAberto(false);
    onStatusChange(novoStatus);
    setSalvando(true);
    setErro(null);
    try {
      await atualizarManutencao(manutencaoId, { status_manutencao: novoStatus });
    } catch (error) {
      onStatusChange(statusAnterior);
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o status da manutenção.");
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
        aria-label={`Status da manutenção ${manutencaoResumo}`}
        disabled={salvando}
        onClick={() => setAberto((valor) => !valor)}
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition disabled:cursor-wait disabled:opacity-60 ${STATUS_MANUTENCAO_CLASSE[status]}`}
      >
        {salvando ? "Salvando..." : STATUS_MANUTENCAO_LABEL[status]}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {aberto && (
        <span
          role="listbox"
          aria-label="Selecionar status da manutenção"
          className="border-border bg-bg absolute top-full left-0 z-30 mt-1 min-w-40 overflow-hidden rounded-lg border p-1 shadow-lg"
        >
          {(Object.keys(STATUS_MANUTENCAO_LABEL) as StatusManutencaoValor[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              role="option"
              aria-selected={status === opcao}
              disabled={salvando || status === opcao}
              onClick={() => void alterarStatus(opcao)}
              className="text-text hover:bg-primary-muted flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition disabled:cursor-default"
            >
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_MANUTENCAO_CLASSE[opcao]}`}>
                {STATUS_MANUTENCAO_LABEL[opcao]}
              </span>
              {status === opcao && <Check size={15} className="text-primary" aria-hidden="true" />}
            </button>
          ))}
        </span>
      )}
      {erro && <span className="text-danger absolute top-full left-0 z-40 mt-1 w-56 rounded bg-bg p-2 text-xs shadow" role="alert">{erro}</span>}
    </span>
  );
}
