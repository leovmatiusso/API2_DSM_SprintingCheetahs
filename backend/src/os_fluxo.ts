export type StatusOSFluxo =
  | "aberta"
  | "em andamento"
  | "teste"
  | "review"
  | "bloqueado"
  | "verificacao"
  | "concluida";

export type ErroTransicaoOS = { status: 400 | 403 | 409; message: string };

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
    if (!responsavelDoTime && !superusuario) {
      return {
        status: 403,
        message: "Somente o responsável do time ou o superusuário pode enviar a O.S. para verificação.",
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
    // Toda O.S. (exceto as do próprio monitoramento) só é concluída após a verificação.
    if (statusNovo === "concluida" && !timeMonitoramento) {
      return { status: 409, message: "A O.S. precisa ser aprovada na verificação do monitoramento para ser concluída." };
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
