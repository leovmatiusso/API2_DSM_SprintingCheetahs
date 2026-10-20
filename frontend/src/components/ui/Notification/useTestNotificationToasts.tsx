import { toast } from "sonner";
import NotificationToast from "./NotificationToast";
import { addStoredNotification, clearStoredNotifications } from "./notification.storage";
import type { NotificationType } from "./notification.config";

const TOAST_DURATION = 5000;

const testNotifications: Array<{
  title: string;
  description: string;
  time: string;
  type: NotificationType;
}> = [
  {
    title: "Nova Ordem de Serviço",
    description: "Uma nova O.S. foi criada: Ajuste no sistema de login para o time Suporte.",
    time: "agora",
    type: "novaOS",
  },
  {
    title: "Nova manutenção criada",
    description: "A manutenção Falha na câmera térmica foi criada para o time Suporte.",
    time: "agora",
    type: "novaManutencao",
  },
  {
    title: "Novo projeto criado",
    description: "Um novo projeto foi criado: Sistema de monitoramento.",
    time: "agora",
    type: "novoProjeto",
  },
  {
    title: "Ordem de Serviço concluída",
    description: "A O.S. Ajuste no sistema de login foi concluída.",
    time: "agora",
    type: "osConcluida",
  },
  {
    title: "Ordem de Serviço bloqueada",
    description: "A O.S. Ajuste no sistema de login foi bloqueada.",
    time: "agora",
    type: "osBloqueada",
  },
];

export function useTestNotificationToasts() {
  function notifyWithToasts() {
    toast.dismiss();
    testNotifications.forEach((notification, index) => {
      setTimeout(() => {
        const storedNotification = addStoredNotification(notification);
        const toastId = toast.custom(
          (toastId) => (
            <NotificationToast
              {...storedNotification}
              toastId={toastId}
              duration={TOAST_DURATION}
            />
          ),
          { duration: Infinity },
        );
      }, index * 1000);
    });
  }

  return { notifyWithToasts };
}

export function clearNotifications() {
  clearStoredNotifications();
}
