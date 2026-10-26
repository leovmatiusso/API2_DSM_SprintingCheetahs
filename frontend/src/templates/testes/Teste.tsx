import { Toaster } from "sonner";
import { clearNotifications, useTestNotificationToasts } from "@/components/ui/Notification/useTestNotificationToasts";
import { Bell, Trash } from 'lucide-react';

export default function Teste() {
  const { notifyWithToasts } = useTestNotificationToasts();

  return (
    <>
      <main className="relative px-6 flex gap-3">
        <button
          type="button"
          onClick={notifyWithToasts}
          className="my-5 cursor-pointer rounded-4xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-800 flex gap-2 items-center"
        >
          Gerar notificações <Bell strokeWidth={2} className="size-4.5"/>
        </button>
        <button
          type="button"
          onClick={clearNotifications}
          className="my-5 cursor-pointer flex gap-2 rounded-4xl bg-transparent px-4 py-2 font-semibold text-red-500 border-2 border-red-500 hover:bg-red-500 items-center hover:text-white"
        >
          Limpar notificações <Trash strokeWidth={2} className="size-4.5"/>
        </button>
      </main>
      <Toaster
        expand
        visibleToasts={9}
        position="bottom-right"
        offset={24}
        toastOptions={{ unstyled: true }}
      />
    </>
  );
}
