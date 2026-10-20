import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getNotificacoes, marcarNotificacaoComoLida } from "@/api";
import NotificationToast from "./NotificationToast";
import type { NotificationType } from "./notification.config";

const TOAST_DURATION = 6000;
const POLL_INTERVAL = 30_000;

interface SeenNotificationState {
  userId: string | null;
  ids: Set<string>;
  skipInitialResults: boolean;
}

function storageKey(userId: string) {
  return `api2:notification-toasts:${userId}`;
}

function loadSeenIds(userId: string): Set<string> | null {
  try {
    const stored = window.sessionStorage.getItem(storageKey(userId));
    if (stored === null) return null;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id): id is string => typeof id === "string"))
      : null;
  } catch {
    return null;
  }
}

function saveSeenIds(userId: string, ids: Set<string>) {
  try {
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
  } catch {
    // In-memory deduplication remains active when session storage is unavailable.
  }
}

function getNotificationType(item: Awaited<ReturnType<typeof getNotificacoes>>["notificacoes"][number]): NotificationType {
  if (item.projeto_id) return "novoProjeto";
  if (item.manutencao_id) return "novaManutencao";
  if (item.titulo === "Ordem de Serviço concluída") return "osConcluida";
  if (item.titulo === "Ordem de Serviço bloqueada") return "osBloqueada";
  if (item.titulo.toLowerCase().includes("ordem de serviço")) return "novaOS";
  return "success";
}

function getToastTitle(item: Awaited<ReturnType<typeof getNotificacoes>>["notificacoes"][number]) {
  switch (getNotificationType(item)) {
    case "novaOS":
      return "Nova Ordem de Serviço";
    case "osConcluida":
      return "Ordem de Serviço concluída";
    case "osBloqueada":
      return "Ordem de Serviço bloqueada";
    case "novoProjeto":
      return "Novo projeto criado";
    case "novaManutencao":
      return "Nova manutenção criada";
    default:
      return item.titulo || "Nova notificação";
  }
}

function getToastDescription(item: Awaited<ReturnType<typeof getNotificacoes>>["notificacoes"][number]) {
  const type = getNotificationType(item);
  if (type === "novaOS") {
    const titulo = item.os_titulo ? `: ${item.os_titulo}` : "";
    const time = item.time_nome ? ` para o time ${item.time_nome}` : "";
    return `Uma nova O.S. foi criada${titulo}${time}.`;
  }
  if (type === "osConcluida") {
    return item.os_titulo
      ? `A O.S. ${item.os_titulo} foi concluída.`
      : "Uma Ordem de Serviço foi concluída.";
  }
  if (type === "osBloqueada") {
    return item.os_titulo
      ? `A O.S. ${item.os_titulo} foi bloqueada.`
      : "Uma Ordem de Serviço foi bloqueada.";
  }
  if (type === "novaManutencao") {
    return item.manutencao_resumo
      ? `Uma nova manutenção foi criada: ${item.manutencao_resumo}.`
      : "Uma nova manutenção foi criada.";
  }
  return item.mensagem || "Uma nova notificação foi recebida.";
}

function getNotificationPath(item: Awaited<ReturnType<typeof getNotificacoes>>["notificacoes"][number]) {
  if (item.projeto_id) return `/projetos-totais/${item.projeto_id}`;
  if (item.manutencao_id) return `/manutencoes-totais/${item.manutencao_id}`;
  if (item.os_id) return `/os/disponiveis/${item.os_id}`;
  return null;
}

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "agora";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface NotificationRow {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
  osId: string | null;
  projectId: string | null;
  maintenanceId: string | null;
}

export function useNotifications(userId: string | null) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const activeUserId = useRef(userId);
  const seenState = useRef<SeenNotificationState>({
    userId: null,
    ids: new Set(),
    skipInitialResults: true,
  });
  activeUserId.current = userId;

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (seenState.current.userId !== userId) {
      const storedIds = loadSeenIds(userId);
      seenState.current = {
        userId,
        ids: storedIds ?? new Set(),
        skipInitialResults: storedIds === null,
      };
    }

    try {
      setLoading(true);
      const response = await getNotificacoes();
      if (activeUserId.current !== userId) return;

      const state = seenState.current;
      const newNotifications = state.skipInitialResults
        ? []
        : response.notificacoes.filter((item) => !state.ids.has(item.id));

      response.notificacoes.forEach((item) => state.ids.add(item.id));
      state.skipInitialResults = false;
      saveSeenIds(userId, state.ids);

      setNotifications(
        response.notificacoes.map((item) => ({
          id: item.id,
          title: item.titulo,
          description: item.mensagem,
          time: formatNotificationTime(item.data_criacao),
          type: getNotificationType(item),
          read: item.lida,
          osId: item.os_id,
          projectId: item.projeto_id,
          maintenanceId: item.manutencao_id,
        })),
      );

      newNotifications.forEach((item) => {
        const type = getNotificationType(item);
        toast.custom(
          (toastId) => createElement(NotificationToast, {
            title: getToastTitle(item),
            description: getToastDescription(item),
            time: formatNotificationTime(item.data_criacao),
            toastId,
            type,
            duration: TOAST_DURATION,
            onClick: getNotificationPath(item)
              ? () => navigate(getNotificationPath(item)!)
              : undefined,
          }),
          { duration: Infinity },
        );
      });
    } catch {
      if (activeUserId.current === userId) setNotifications([]);
    } finally {
      if (activeUserId.current === userId) setLoading(false);
    }
  }, [navigate, userId]);

  useEffect(() => {
    setNotifications([]);
    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL);
    return () => window.clearInterval(interval);
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
