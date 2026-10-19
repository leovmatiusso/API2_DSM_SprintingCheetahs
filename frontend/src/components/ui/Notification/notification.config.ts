import { Wrench, ClipboardCheck, ClipboardX, FolderPlus, ClipboardPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const notificationConfig = {
  novaOS: {
    color: "#3e69c5",
    icon: ClipboardPlus,
  },
  novaManutencao: {
    color: "#9810fa",
    icon: Wrench,
  },
  novoProjeto: {
    color: "#f6339a",
    icon: FolderPlus,
  },
  success: {
    color: "#4BB84B",
    icon: ClipboardCheck,
  },
  danger: {
    color: "#E24056",
    icon: ClipboardX,
  },
} as const satisfies Record<
  string,
  {
    color: `#${string}`;
    icon: LucideIcon;
  }
>;

export type NotificationType = keyof typeof notificationConfig;