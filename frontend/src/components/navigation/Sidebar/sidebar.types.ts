import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export interface SidebarItemConfig {
  label: string;
  icon: LucideIcon;
  path: string;
  roles?: Role[];
}
