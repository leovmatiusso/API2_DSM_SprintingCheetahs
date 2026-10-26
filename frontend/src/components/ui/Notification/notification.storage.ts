import type { NotificationType } from "./notification.config";

export interface StoredNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

const STORAGE_KEY = "altave-test-notifications";
const NOTIFICATIONS_UPDATED_EVENT = "altave-test-notifications-updated";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredNotifications(): StoredNotification[] {
  if (!canUseStorage()) return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const notifications: unknown = JSON.parse(value);
    return Array.isArray(notifications) ? (notifications as StoredNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: StoredNotification[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}

export function addStoredNotification(notification: Omit<StoredNotification, "id" | "read">) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  const nextNotification: StoredNotification = { ...notification, id, read: false };
  saveNotifications([nextNotification, ...getStoredNotifications()]);
  return nextNotification;
}

export function markAllNotificationsAsRead() {
  saveNotifications(
    getStoredNotifications().map((notification) => ({ ...notification, read: true })),
  );
}

export function clearStoredNotifications() {
  saveNotifications([]);
}

export { NOTIFICATIONS_UPDATED_EVENT };
