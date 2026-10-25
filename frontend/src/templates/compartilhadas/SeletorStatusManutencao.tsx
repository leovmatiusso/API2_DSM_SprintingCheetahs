import { ChevronDown } from "lucide-react";

export type StatusManutencaoValor = "aberta" | "em_andamento" | "concluida" | "cancelada";

export const STATUS_MANUTENCAO_LABEL: Record<StatusManutencaoValor, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

interface SeletorStatusManutencaoProps {
  value: StatusManutencaoValor | "";
  onChange: (value: StatusManutencaoValor) => void;
}

export default function SeletorStatusManutencao({ value, onChange }: SeletorStatusManutencaoProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-text text-sm font-semibold">
        Status <span className="text-danger">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as StatusManutencaoValor)}
          className="border-border bg-primary-muted text-primary w-full appearance-none rounded-lg px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
          required
        >
          <option value="" hidden>
            Selecione o status
          </option>
          {Object.entries(STATUS_MANUTENCAO_LABEL).map(([val, label]) => (
            <option key={val} value={val} className="bg-bg text-text">
              {label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-primary">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}