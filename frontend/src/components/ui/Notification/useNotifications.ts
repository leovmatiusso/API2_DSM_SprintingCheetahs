import { useCallback, useEffect, useState } from "react";
import { getNotificacoes, marcarNotificacaoComoLida } from "@/api";

export interface NotificationRow {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "novaOS" | "novaManutencao" | "novoProjeto" | "success" | "danger";
  read: boolean;
  osId: string | null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotificacoes();
      setNotifications(
        response.notificacoes.map((item) => ({
          id: item.id,
          title: item.titulo,
          description: item.mensagem,
          time: new Date(item.data_criacao).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: item.titulo.includes("Nova") ? "novaOS" : "success",
          read: item.lida,
          osId: item.os_id,
        })),
      );
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((notification) => !notification.read);
    if (!unread.length) return;

    await Promise.all(unread.map((notification) => marcarNotificacaoComoLida(notification.id)));
    await refresh();
  }, [notifications, refresh]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await marcarNotificacaoComoLida(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  return {
    notifications,
    hasUnread: notifications.some((notification) => !notification.read),
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
