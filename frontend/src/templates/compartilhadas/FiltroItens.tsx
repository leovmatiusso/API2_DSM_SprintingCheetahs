import { useCallback, useRef, useState } from "react";
import { ListFilter, X } from "lucide-react";
import SelectFiltro from "./SelectFiltro";
import FecharSelectAoClicarFora from "./FecharSelectAoClicarFora";
import { PRIORIDADE_LABEL } from "./osEstilos";

export default function FiltroItens({ status, prioridade, opcoesStatus, aoMudar }: {
  status: string;
  prioridade: string;
  opcoesStatus: { value: string; label: string }[];
  aoMudar: (campo: "status" | "prioridade", valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fechar = useCallback(() => setAberto(false), []);
  FecharSelectAoClicarFora(containerRef, aberto, fechar);
  const prioridadeLabel = PRIORIDADE_LABEL[prioridade as keyof typeof PRIORIDADE_LABEL];
  const statusLabel = opcoesStatus.find((item) => item.value === status)?.label;

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2">
      {statusLabel && <button type="button" onClick={() => aoMudar("status", "")} aria-label={`Remover filtro ${statusLabel}`} className="border-primary/40 bg-primary-muted text-primary inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium">{statusLabel}<X size={13} /></button>}
      {prioridadeLabel && <button type="button" onClick={() => aoMudar("prioridade", "")} aria-label={`Remover filtro ${prioridadeLabel}`} className="border-primary/40 bg-primary-muted text-primary inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium">{prioridadeLabel}<X size={13} /></button>}
      <div className="relative">
        <button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto} className="border-primary/40 bg-primary-muted text-primary inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium"><ListFilter size={16} /> Filtrar</button>
        {aberto && <div className="border-border bg-bg absolute top-full right-0 z-30 mt-2 grid w-56 gap-2 rounded-xl border p-3 shadow-lg">
          <SelectFiltro placeholder="Status" value={status} options={opcoesStatus} onChange={(value) => aoMudar("status", value)} />
          <SelectFiltro placeholder="Prioridade" value={prioridade} options={Object.entries(PRIORIDADE_LABEL).map(([value, label]) => ({ value, label }))} onChange={(value) => aoMudar("prioridade", value)} />
          <button type="button" className="text-primary py-1 text-left text-sm" onClick={() => { aoMudar("status", ""); aoMudar("prioridade", ""); }}>Limpar filtros</button>
        </div>}
      </div>
    </div>
  );
}
