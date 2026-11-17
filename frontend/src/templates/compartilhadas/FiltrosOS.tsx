import { useEffect, useRef, useState } from "react";
import { ListFilter, X } from "lucide-react";

import type { OrdemServicoResumo } from "@/api";

import { PRIORIDADE_LABEL, STATUS_LABEL } from "./osEstilos";

export interface FiltrosOrdens {
  departamento: string;
  prioridade: string;
  status: string;
  atrasadas: boolean;
}

export const FILTROS_VAZIOS: FiltrosOrdens = {
  departamento: "",
  prioridade: "",
  status: "",
  atrasadas: false,
};

function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Atrasada: prazo já passou e a O.S. ainda não foi concluída.
export function osAtrasada(os: OrdemServicoResumo): boolean {
  return Boolean(os.data_limite) && os.status !== "concluida" && os.data_limite! < hojeISO();
}

export function aplicarFiltros(ordens: OrdemServicoResumo[], filtros: FiltrosOrdens) {
  return ordens.filter(
    (os) =>
      (!filtros.departamento || os.departamento === filtros.departamento) &&
      (!filtros.prioridade || os.prioridade === filtros.prioridade) &&
      (!filtros.status || os.status === filtros.status) &&
      (!filtros.atrasadas || osAtrasada(os)),
  );
}

const classeSelect =
  "border-border bg-bg text-text h-9 w-full min-w-0 rounded-lg border px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary";

// Botão "Filtrar" com o painel de filtros e os filtros ativos em destaque (removíveis).
export default function FiltrosOS({
  ordens,
  filtros,
  onChange,
}: {
  ordens: OrdemServicoResumo[];
  filtros: FiltrosOrdens;
  onChange: (filtros: FiltrosOrdens) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<FiltrosOrdens>(filtros);
  const painelRef = useRef<HTMLDivElement>(null);

  const departamentos = [
    ...new Set(ordens.map((os) => os.departamento).filter((d): d is string => Boolean(d))),
  ].sort();

  useEffect(() => {
    if (!aberto) return;
    function fecharFora(event: MouseEvent) {
      if (painelRef.current && !painelRef.current.contains(event.target as Node)) setAberto(false);
    }
    function fecharEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    };
  }, [aberto]);

  function abrirPainel() {
    setRascunho(filtros);
    setAberto((valor) => !valor);
  }

  const ativos: { chave: keyof FiltrosOrdens; rotulo: string; destaque?: boolean }[] = [
    ...(filtros.atrasadas ? [{ chave: "atrasadas" as const, rotulo: "Atrasada", destaque: true }] : []),
    ...(filtros.departamento ? [{ chave: "departamento" as const, rotulo: filtros.departamento }] : []),
    ...(filtros.prioridade
      ? [{ chave: "prioridade" as const, rotulo: PRIORIDADE_LABEL[filtros.prioridade as keyof typeof PRIORIDADE_LABEL] ?? filtros.prioridade }]
      : []),
    ...(filtros.status
      ? [{ chave: "status" as const, rotulo: STATUS_LABEL[filtros.status as keyof typeof STATUS_LABEL] ?? filtros.status }]
      : []),
  ];

  return (
    <div ref={painelRef} className="relative flex flex-wrap items-center gap-2">
      {ativos.map(({ chave, rotulo, destaque }) => (
        <button
          key={chave}
          type="button"
          onClick={() => onChange({ ...filtros, [chave]: FILTROS_VAZIOS[chave] })}
          title={`Remover filtro ${rotulo}`}
          aria-label={`Remover filtro ${rotulo}`}
          className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-3 text-xs font-medium transition ${
            destaque
              ? "border-danger/40 bg-danger-alt text-danger-alt-inverted"
              : "border-primary/40 bg-primary-muted text-primary"
          }`}
        >
          {rotulo}
          <X size={13} aria-hidden="true" />
        </button>
      ))}

      <div>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={aberto}
          onClick={abrirPainel}
          className="border-primary/40 bg-primary-muted text-primary inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium"
        >
          <ListFilter size={16} aria-hidden="true" />
          Filtrar
        </button>

        {aberto && (
          <div
            role="dialog"
            aria-label="Filtros das ordens de serviço"
            className="border-border bg-bg absolute top-full left-0 z-30 mt-2 w-[min(26rem,calc(100vw-2.5rem))] rounded-xl border p-3 shadow-lg lg:right-0 lg:left-auto"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                aria-label="Departamento"
                value={rascunho.departamento}
                onChange={(e) => setRascunho({ ...rascunho, departamento: e.target.value })}
                className={classeSelect}
              >
                <option value="">Departamento</option>
                {departamentos.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                aria-label="Prioridade"
                value={rascunho.prioridade}
                onChange={(e) => setRascunho({ ...rascunho, prioridade: e.target.value })}
                className={classeSelect}
              >
                <option value="">Prioridade</option>
                {Object.entries(PRIORIDADE_LABEL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
              <select
                aria-label="Status"
                value={rascunho.status}
                onChange={(e) => setRascunho({ ...rascunho, status: e.target.value })}
                className={classeSelect}
              >
                <option value="">Status</option>
                {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                aria-pressed={rascunho.atrasadas}
                onClick={() => setRascunho({ ...rascunho, atrasadas: !rascunho.atrasadas })}
                className={`h-8 cursor-pointer rounded-lg border px-3 text-xs font-medium transition ${
                  rascunho.atrasadas
                    ? "border-danger bg-danger-alt text-danger-alt-inverted"
                    : "border-danger/40 text-danger"
                }`}
              >
                Atrasadas
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRascunho(FILTROS_VAZIOS);
                    onChange(FILTROS_VAZIOS);
                    setAberto(false);
                  }}
                  className="border-border text-text-muted hover:text-text h-8 cursor-pointer rounded-lg border px-3 text-xs font-medium"
                >
                  Limpar filtros
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(rascunho);
                    setAberto(false);
                  }}
                  className="bg-primary hover:bg-primary-hover h-8 cursor-pointer rounded-lg px-3 text-xs font-medium text-white"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
