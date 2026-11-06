export type StatusOSFluxo =
  | "aberta"
  | "em andamento"
  | "teste"
  | "review"
  | "bloqueado"
  | "verificacao"
  | "concluida";

export type ErroTransicaoOS = { status: 400 | 403 | 409; message: string };

// O.S. de times de software precisam ser aprovadas pelo monitoramento para serem concluídas.
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
  timeSoftware = false,
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

  if (statusNovo === "verificacao") {
    if (statusAtual !== "review") {
      return { status: 409, message: "A O.S. precisa passar por Review antes da verificação." };
    }
    if (!responsavelDoTime) {
      return { status: 403, message: "Somente o responsável do time pode enviar a O.S. para verificação." };
    }
    if (!timeSoftware) {
      return { status: 409, message: "Somente O.S. de times de software passam por verificação." };
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
    if (statusNovo === "concluida" && timeSoftware) {
      return { status: 409, message: "A O.S. de software precisa ser aprovada na verificação do monitoramento." };
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
