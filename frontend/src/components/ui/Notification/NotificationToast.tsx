import { toast } from "sonner";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { notificationConfig, type NotificationType } from "./notification.config";
import NotificationMessage from "./NotificationMessage";

const hoveredToastIds = new Set<string | number>();
const hoverReleaseTimers = new Map<string | number, number>();
const HOVER_CHANGE_EVENT = "notification-toast-hover-change";

function notifyHoverChange(toastId: string | number, isHovered: boolean) {
  const pendingRelease = hoverReleaseTimers.get(toastId);
  if (pendingRelease !== undefined) {
    window.clearTimeout(pendingRelease);
    hoverReleaseTimers.delete(toastId);
  }

  if (isHovered) {
    hoveredToastIds.add(toastId);
  } else {
    const releaseTimer = window.setTimeout(() => {
      hoveredToastIds.delete(toastId);
      window.dispatchEvent(new Event(HOVER_CHANGE_EVENT));
    }, 50);
    hoverReleaseTimers.set(toastId, releaseTimer);
  }

  window.dispatchEvent(new Event(HOVER_CHANGE_EVENT));
}

interface NotificationToastProps {
  title: string;
  description: string;
  time: string;
  toastId: string | number;
  type: NotificationType;
  duration: number;
  onClick?: () => void;
}

export default function NotificationToast({
  title,
  description,
  time,
  toastId,
  type,
  duration,
  onClick,
}: NotificationToastProps) {
  const { color, icon: Icon } = notificationConfig[type];
  const [isClosing, setIsClosing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnyToastHovered, setIsAnyToastHovered] = useState(hoveredToastIds.size > 0);
  const [progress, setProgress] = useState(1);
  const remainingTime = useRef(duration);

  useEffect(() => {
    const handleHoverChange = () => setIsAnyToastHovered(hoveredToastIds.size > 0);
    window.addEventListener(HOVER_CHANGE_EVENT, handleHoverChange);

    return () => {
      window.removeEventListener(HOVER_CHANGE_EVENT, handleHoverChange);
      notifyHoverChange(toastId, false);
    };
  }, [toastId]);

  useEffect(() => {
    const isPaused = isHovered || isAnyToastHovered;
    if (isClosing || isPaused) return;

    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      remainingTime.current -= now - lastTick;
      lastTick = now;

      const nextProgress = Math.max(remainingTime.current / duration, 0);
      setProgress(nextProgress);

      if (remainingTime.current <= 0) {
        setIsClosing(true);
      }
    }, 150);

    return () => window.clearInterval(timer);
  }, [duration, isAnyToastHovered, isClosing, isHovered, toastId]);

  return (
    <div
      className={`border-border group bg-bg/95 hover:bg-bg flex w-100 flex-col overflow-hidden rounded-xl border shadow-xl/5 backdrop-blur-md ${
        isClosing ? "animate-[toast-out_300ms_ease-in_forwards]" : ""
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        notifyHoverChange(toastId, true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        notifyHoverChange(toastId, false);
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === "toast-out") {
          toast.dismiss(toastId);
        }
      }}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          disabled={!onClick}
          onClick={() => {
            if (!onClick) return;
            onClick();
            setIsClosing(true);
          }}
          aria-label={onClick ? `${title}. Abrir detalhes` : undefined}
          className={`flex min-w-0 flex-1 items-center gap-3 text-left ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
          <div
            style={{ color: color, backgroundColor: `${color}20`  }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm"
          >
            <Icon className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-text truncate text-sm font-semibold xl:text-base">{title}</p>

            <p className="text-text/75 mt-0.5 truncate text-xs xl:text-sm">
              <NotificationMessage message={description} />
            </p>

            <p className="text-text-muted mt-1 text-[10px] xl:text-xs">{time}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsClosing(true);
          }}
          aria-label="Fechar notificação"
          title="Fechar notificação"
          className="text-text-muted shrink-0 cursor-pointer self-start px-1 hover:text-red-700/75"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        className={`bg-primary h-[2px] w-full origin-left ${isAnyToastHovered ? 'opacity-0' : 'opacity-100'} transition-all duration-300 ease-in-out`}
        style={{
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
}
