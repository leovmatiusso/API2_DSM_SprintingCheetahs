import { useCallback, useEffect, useState } from "react";
import {
  getStoredNotifications,
  markAllNotificationsAsRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type StoredNotification,
} from "./notification.storage";

export function useNotifications() {
  const [notifications, setNotifications] = useState<StoredNotification[]>(() =>
    getStoredNotifications(),
  );

  useEffect(() => {
    const refresh = () => setNotifications(getStoredNotifications());
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const markAllAsRead = useCallback(() => markAllNotificationsAsRead(), []);

  return {
    notifications,
    hasUnread: notifications.some((notification) => !notification.read),
    markAllAsRead,
  };
}
