export type StatusOSFluxo =
  | "aberta"
  | "em andamento"
  | "teste"
  | "review"
  | "bloqueado"
  | "concluida";

export type ErroTransicaoOS = { status: 400 | 403 | 409; message: string };

export function validarTransicaoOS(
  statusAtual: StatusOSFluxo,
  statusNovo: StatusOSFluxo,
  responsavelDoTime: boolean,
): ErroTransicaoOS | null {
  if (statusAtual === statusNovo) return null;

  if (statusAtual === "concluida") {
    return { status: 409, message: "Uma O.S. concluída não pode voltar para outra etapa." };
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
