import type { OrdemServicoResumo, StatusItem, StatusProjeto } from "@/api";

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
  verificacao: "Verificação",
};

// Para onde o usuário vai depois de concluir uma O.S.
// Trocar pela rota da aba de histórico quando ela existir.
export const ROTA_APOS_CONCLUIR_OS = "/os/disponiveis";

export function isTimeSoftware(departamento: string | null | undefined): boolean {
  return (departamento ?? "").toLowerCase().includes("software");
}

// Nenhuma O.S. pode ser atribuída ao monitoramento, que apenas verifica as O.S. de outros times.
export function isTimeMonitoramento(departamento: string | null | undefined): boolean {
  return (departamento ?? "").toLowerCase().includes("monitoramento");
}

export const STATUS_CLASSE: Record<OrdemServicoResumo["status"], string> = {
  aberta: "bg-bg-tertiary text-text-muted",
  "em andamento": "bg-primary-muted text-primary",
  concluida: "bg-success-alt text-success-alt-inverted",
  teste: "bg-orange-300/30 text-orange-950",
  bloqueado: "bg-danger-alt text-danger-alt-inverted",
  review: "bg-warning-alt text-warning-alt-inverted",
  verificacao: "bg-laranja-alt text-laranja-alt-inverted",
};

// Status de projeto/manutenção (derivado das O.S.)
export const STATUS_ITEM_LABEL: Record<StatusItem, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_ITEM_CLASSE: Record<StatusItem, string> = {
  nao_iniciado: "bg-bg-tertiary text-text-muted",
  em_andamento: "bg-success-alt text-success-alt-inverted",
  concluido: "bg-primary-muted text-primary",
  cancelado: "bg-danger-alt text-danger-alt-inverted",
};

export const STATUS_PROJETO_LABEL: Record<StatusProjeto, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

export const STATUS_PROJETO_CLASSE: Record<StatusProjeto, string> = {
  aberto: "bg-bg-tertiary text-text-muted",
  em_andamento: "bg-primary-muted text-primary",
  finalizado: "bg-success-alt text-success-alt-inverted",
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
