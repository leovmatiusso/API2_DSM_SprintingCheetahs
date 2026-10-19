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
    title: "Nova ordem de serviço",
    description: "OS criada por Manoel Gomes do time Suporte",
    time: "agora",
    type: "novaOS",
  },
  {
    title: "Nova manutenção",
    description: "OS criada por Manoel Gomes do time Suporte",
    time: "agora",
    type: "novaManutencao",
  },
  {
    title: "Novo projeto",
    description: "OS criada por Manoel Gomes do time Suporte",
    time: "agora",
    type: "novoProjeto",
  },
  {
    title: "Ordem de serviço concluída",
    description: "Ordem de serviço concluída",
    time: "agora",
    type: "success",
  },
  {
    title: "Ordem de serviço bloqueada",
    description: "OS criada por Manoel Gomes do time Suporte",
    time: "agora",
    type: "danger",
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
