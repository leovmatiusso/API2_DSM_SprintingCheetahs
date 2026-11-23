export type StatusOSFluxo =
  | "aberta"
  | "em andamento"
  | "teste"
  | "review"
  | "bloqueado"
  | "concluida"
  | "verificacao";

export type ErroTransicaoOS = { status: 400 | 403 | 409; message: string };

export const MENSAGEM_APROVADA_REGISTRAR_RESUMO =
  "Esta O.S. foi aprovada na verificação. O líder do time deve registrar o resumo das atividades para concluí-la.";

export function isCriticalPriority(prioridade: string | null | undefined): boolean {
  const normalizada = String(prioridade ?? "").trim().toLowerCase();
  return normalizada === "critica" || normalizada === "crítica";
}

export function shouldNotifyCriticalPriority(
  prioridadeAnterior: string | null | undefined,
  prioridadeNova: string | null | undefined,
): boolean {
  return isCriticalPriority(prioridadeNova) && !isCriticalPriority(prioridadeAnterior);
}

// Identifica times de software pelo departamento.
export function isTimeSoftware(departamento: string | null | undefined): boolean {
  return String(departamento ?? "").toLowerCase().includes("software");
}

// O monitoramento verifica as O.S. de outros times: nenhuma O.S. pode ser atribuída a ele.
export function isTimeMonitoramento(departamento: string | null | undefined): boolean {
  return String(departamento ?? "").toLowerCase().includes("monitoramento");
}

export function validarTransicaoOS(
  statusAtual: StatusOSFluxo,
  statusNovo: StatusOSFluxo,
  responsavelDoTime: boolean,
  timeMonitoramento = false,
  superusuario = false,
  // true quando a O.S. voltou da verificação aprovada e aguarda o resumo do líder para ser concluída.
  aprovadaNaVerificacao = false,
): ErroTransicaoOS | null {
  if (statusAtual === statusNovo) return null;

  if (statusAtual === "concluida") {
    return { status: 409, message: "Uma O.S. concluída não pode voltar para outra etapa." };
  }

  if (statusAtual === "verificacao") {
    return {
      status: 409,
      message: "Esta O.S. está em verificação: somente o monitoramento pode aprová-la ou reprová-la.",
    };
  }

  // Aprovada na verificação: a O.S. fica em Review até o líder registrar o resumo (o que a conclui).
  // Nenhuma outra mudança de status é permitida nessa etapa.
  if (statusAtual === "review" && aprovadaNaVerificacao && statusNovo !== "verificacao") {
    return { status: 409, message: MENSAGEM_APROVADA_REGISTRAR_RESUMO };
  }

  // O superusuário só atua enviando uma O.S. em Review para verificação.
  if (superusuario && !(statusAtual === "review" && statusNovo === "verificacao")) {
    return {
      status: 403,
      message: "O superusuário só pode enviar uma O.S. em Review para verificação.",
    };
  }

  if (statusNovo === "verificacao") {
    if (statusAtual !== "review") {
      return { status: 409, message: "A O.S. precisa passar por Review antes da verificação." };
    }
    if (!responsavelDoTime) {
      return {
        status: 403,
        message: "Somente o líder do time responsável pode enviar a O.S. para verificação.",
      };
    }
    if (timeMonitoramento) {
      return { status: 409, message: "O.S. do time de monitoramento não passa por verificação." };
    }
    return null;
  }

  if (statusNovo === "review") {
    return statusAtual === "bloqueado"
      ? {
          status: 409,
          message: "Resolva o bloqueio e envie a O.S. para Teste antes de uma nova revisão.",
        }
      : null;
  }

  if (statusAtual === "review") {
    if (!responsavelDoTime) {
      return { status: 403, message: "Somente o responsável do time pode decidir uma O.S. em revisão." };
    }
    if (!["teste", "bloqueado", "concluida"].includes(statusNovo)) {
      return { status: 400, message: "Na revisão, escolha Teste, Bloqueada ou Concluída." };
    }
    // A conclusão não é feita pelo status: acontece quando o líder registra o resumo das atividades.
    if (statusNovo === "concluida") {
      return {
        status: 409,
        message: timeMonitoramento
          ? "Para concluir a O.S., registre o resumo das atividades."
          : "A O.S. precisa ser aprovada na verificação do monitoramento e ter o resumo registrado para ser concluída.",
      };
    }
    return null;
  }

  if (statusAtual === "bloqueado") {
    return responsavelDoTime && statusNovo === "teste"
      ? null
      : {
          status: 403,
          message: "Somente o responsável do time pode liberar a O.S. bloqueada para Teste.",
        };
  }

  if (statusNovo === "bloqueado" || statusNovo === "concluida") {
    return { status: 409, message: "A O.S. precisa passar por Review antes de ser bloqueada ou concluída." };
  }

  return null;
}
