import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  Home,
  Settings,
  Users,
  UserRoundPlus,
} from "lucide-react";

import type { SidebarItemConfig } from "./sidebar.types";

export const menuItems: SidebarItemConfig[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },

  {
    label: "Minha conta",
    icon: Settings,
    path: "/minha-conta",
  },

  {
    label: "Usuários",
    icon: Users,
    path: "/usuarios",
    roles: ["superusuario", "gestor"],
  },

  {
    label: "Ordens disponíveis",
    icon: ClipboardList,
    path: "/os/disponiveis",
    roles: ["gestor"],
  },

  {
    label: "Minhas O.S.",
    icon: ClipboardList,
    path: "/os/minhas",
    roles: [
      "comercial",
      "suporte",
      "producao",
      "software",
      "implantacao",
    ],
  },

  {
    label: "Nova O.S.",
    icon: FilePlus2,
    path: "/os/nova-projeto",
    roles: ["comercial"],
  },

  {
    label: "Nova manutenção",
    icon: FilePlus2,
    path: "/os/nova-manutencao",
    roles: ["suporte"],
  },

  {
    label: "Execução",
    icon: ClipboardList,
    path: "/execucao/producao",
    roles: ["producao"],
  },

  {
    label: "Execução",
    icon: ClipboardList,
    path: "/execucao/software",
    roles: ["software"],
  },

  {
    label: "Execução",
    icon: ClipboardList,
    path: "/execucao/implantacao",
    roles: ["implantacao"],
  },

  {
    label: "Relatórios",
    icon: BarChart3,
    path: "/relatorios",
    roles: ["gestor"],
  },

  {
    label: "Cadastrar",
    icon: UserRoundPlus,
    path: "/cadastro",
    roles: ["superusuario", "gestor"],
  },
];