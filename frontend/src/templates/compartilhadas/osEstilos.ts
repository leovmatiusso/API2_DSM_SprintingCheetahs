import type { OrdemServicoResumo } from "@/api";

export const PRIORIDADE_LABEL: Record<OrdemServicoResumo["prioridade"], string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const PRIORIDADE_CLASSE: Record<OrdemServicoResumo["prioridade"], string> = {
  baixa: "bg-success-alt text-success-alt-inverted",
  media: "bg-warning-alt text-warning-alt-inverted",
  alta: "bg-laranja-alt text-laranja-alt-inverted",
  critica: "bg-danger-alt text-danger-alt-inverted",
};

export const STATUS_LABEL: Record<OrdemServicoResumo["status"], string> = {
  aberta: "Aberta",
  "em andamento": "Em andamento",
  concluida: "Concluída",
  teste: "Teste",
  bloqueado: "Bloqueado",
  review: "Review",
};

export const STATUS_CLASSE: Record<OrdemServicoResumo["status"], string> = {
  aberta: "bg-blue-100 text-blue-800",
  "em andamento": "bg-green-300 text-black",
  concluida: "bg-pink-300 text-black",
  teste: "bg-orange-300 text-black",
  bloqueado: "bg-danger-alt text-danger-alt-inverted",
  review: "bg-warning-alt text-warning-alt-inverted",
};

export function formatarData(data: string | null): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

export function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
