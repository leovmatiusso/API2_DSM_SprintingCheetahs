import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Search, Trash2, User } from "lucide-react";
import { getCurrentUser, logout } from "@/auth";
import { isCriticalNotificationType, notificationConfig } from "@/components/ui/Notification/notification.config";
import NotificationMessage from "@/components/ui/Notification/NotificationMessage";
import { useNotifications } from "@/components/ui/Notification/useNotifications";
import Input from "@/components/ui/Input";

export default function Header() {
  const navigate = useNavigate();
  const [notificacaoAberto, setNotificacaoAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const user = getCurrentUser();
  const { notifications, hasUnread, markAsRead, markAllAsRead, deleteNotification, refresh } = useNotifications(user?.id ?? null);

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="border-border bg-bg flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-3 min-w-[450px] w-1/3">
        {/* <Input 
        iconLeft={Search}
        placeholder="Buscar usuários, equipes, ordens de serviço..."
        /> */}
        <div className="relative inline-block">
          <button
            type="button"
            aria-label="Notificações"
            className="group hover:bg-bg-tertiary relative cursor-pointer rounded-lg p-1.5"
            onClick={() => {
              const abrir = !notificacaoAberto;
              setNotificacaoAberto(abrir);
              if (abrir) void refresh();
            }}
          >
            <Bell className="text-text-muted group-hover:text-text size-6" />
            {hasUnread && (
              <span className="ring-bg absolute right-1.5 bottom-1.5 size-2 rounded-full bg-red-500 ring-2" />
            )}
          </button>

          {notificacaoAberto && (
            <div className="absolute top-full left-1/2 z-50 mt-4 w-[min(500px,calc(100vw-2rem))] translate-x-[-16.5%]">
              <div className="border-border bg-bg absolute -top-2 left-[16.5%] z-10 size-4 -translate-x-1/2 rotate-45 border-t border-l" />
              <section className="border-border bg-bg relative overflow-hidden rounded-3xl border shadow-2xl">
                <header className="border-border flex items-center justify-between gap-4 border-b px-4 py-5">
                  <h2 className="text-text text-lg font-bold">Notificações ({notifications.filter((notification) => !notification.read).length})</h2>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-primary shrink-0 cursor-pointer text-sm font-semibold hover:opacity-75"
                  >
                    Marcar como lidas
                  </button>
                </header>
                <div className="h-[min(400px,calc(100vh-2rem))] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
                  {notifications.length === 0 && (
                    <p className="text-text-muted p-6 text-center text-sm">Nenhuma notificação.</p>
                  )}
                  {notifications.map((notification) => {
                    const { color, icon: Icon } = notificationConfig[notification.type];
                    const isCritical = isCriticalNotificationType(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`group/notification border-border relative isolate z-0 flex w-full items-start border-b last:border-b-0 hover:z-10 focus-within:z-10 ${isCritical ? "border-l-4 border-l-[#E24056] bg-[#E24056]/10 hover:bg-[#E24056]/15" : notification.read ? "bg-bg hover:bg-bg-tertiary" : "bg-primary/10 hover:bg-bg-tertiary"}`}
                      >
                        <button
                          type="button"
                          title={notification.description}
                          onClick={() => {
                            if (!notification.read) {
                              void markAsRead(notification.id);
                            }
                            if (notification.projectId) {
                              navigate(`/projetos-totais/${notification.projectId}`);
                            } else if (notification.maintenanceId) {
                              navigate(`/manutencoes-totais/${notification.maintenanceId}`);
                            } else if (notification.osId) {
                              navigate(`/os/disponiveis/${notification.osId}`);
                            }
                          }}
                          className="relative z-0 flex min-w-0 flex-1 items-center gap-4 px-4 py-4 text-left transition-colors"
                        >
                          <div
                            className="flex size-12 shrink-0 items-center justify-center rounded-full"
                            style={{ color: color, backgroundColor: `${color}20`  }}
                          >
                            <Icon className="size-7" strokeWidth={1.7} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="text-text min-w-0 flex-1 truncate text-sm font-semibold">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className={`size-2 shrink-0 rounded-full ${isCritical ? "bg-[#E24056]" : "bg-primary"}`} />
                              )}
                              {isCritical && (
                                <span className="flex min-w-[54px] shrink-0 justify-center whitespace-nowrap rounded bg-[#E24056] px-1.5 py-1 text-[9px] leading-none font-extrabold text-white">
                                  CRÍTICA
                                </span>
                              )}
                            </div>
                            <div className="mt-1 max-h-10 overflow-hidden text-xs font-medium transition-[max-height] duration-300 ease-in-out group-hover/notification:max-h-[60vh] group-hover/notification:overflow-y-auto group-focus-within/notification:max-h-[60vh] group-focus-within/notification:overflow-y-auto [@media(hover:none)]:max-h-none">
                              <p className="text-text/70 line-clamp-2 wrap-break-word group-hover/notification:line-clamp-none group-focus-within/notification:line-clamp-none [@media(hover:none)]:line-clamp-none">
                                <NotificationMessage message={notification.description} />
                              </p>
                            </div>
                            <p className="text-text-muted mt-0.5 text-[10px] font-medium">
                              {notification.time}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          aria-label={`Apagar notificação: ${notification.title}`}
                          title="Apagar notificação"
                          onClick={() => void deleteNotification(notification.id)}
                          className="text-text-muted hover:text-red-600 relative z-20 mt-4 mr-2 shrink-0 cursor-pointer rounded-lg bg-inherit p-2 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="hover:bg-bg-tertiary flex items-center gap-2 rounded-lg px-3 py-2 transition"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <User size={18} />
          </div>
          <span className="text-sm font-medium">{user?.name ?? "Usuário"}</span>
          <ChevronDown
            size={17}
            className={`transition-transform ${menuAberto ? "rotate-180" : ""}`}
          />
        </button>
        {menuAberto && (
          <div className="border-border bg-bg absolute right-0 z-10 mt-2 w-44 rounded-lg border p-1 shadow-md">
            <button
              type="button"
              onClick={() => navigate("/minha-conta")}
              className="hover:bg-bg-tertiary w-full rounded-md px-3 py-2 text-left text-sm transition"
            >
              Minha conta
            </button>
            <button
              type="button"
              onClick={sair}
              className="hover:bg-bg-tertiary w-full rounded-md px-3 py-2 text-left text-sm transition"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
