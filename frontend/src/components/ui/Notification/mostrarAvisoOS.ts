import { createElement } from "react";
import { toast } from "sonner";

import NotificationToast from "./NotificationToast";

const DURACAO_AVISO = 5000;

// Aviso rápido que continua visível mesmo depois de o usuário ser redirecionado de tela.
export function mostrarAvisoOS(tipo: "success" | "danger", titulo: string, descricao: string) {
  toast.custom((toastId) =>
    createElement(NotificationToast, {
      title: titulo,
      description: descricao,
      time: "agora",
      toastId,
      type: tipo,
      duration: DURACAO_AVISO,
    }),
  );
}
