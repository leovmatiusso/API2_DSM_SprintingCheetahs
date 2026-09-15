import {
  Home,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";

import type { SidebarItemConfig } from "./sidebar.types";

export const menuItems: SidebarItemConfig[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/",
  },
  {
    label: "Usuários",
    icon: Users,
    path: "/usuarios",
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    path: "/relatorios",
  },
  {
    label: "Configurações",
    icon: Settings,
    path: "/configuracoes",
  },
];