import {
  BarChart3,
  ClipboardList,
  Home,
  Settings,
  Users,
  User,
  ListTodo,
  CirclePlus,
  Wrench,
} from "lucide-react";

import type { SidebarItemConfig } from "./sidebar.types";

export const menuItems: SidebarItemConfig[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
  },

  {
    label: "Usuários",
    icon: User,
    path: "/usuarios",
    roles: ["superusuario", "gestor"],
  },

  {
    label: "Times",
    icon: Users,
    path: "/times",
    roles: ["superusuario", "gestor"],
  },

  {
    label: "Ordens disponíveis",
    icon: ListTodo,
    path: "/os/disponiveis",
    excludedRoles: ["superusuario"],
  },

  {
    label: "Projetos",
    icon: ClipboardList,
    path: "/projetos-totais",
    excludedRoles: ["superusuario", "suporte"],
  },

  {
    label: "Manutenções",
    icon: Wrench,
    path: "/manutencoes-totais",
    excludedRoles: ["superusuario", "comercial"],
  },

  {
    label: "Novo projeto",
    icon: CirclePlus,
    path: "/novo-projeto",
    roles: ["comercial"],
  },

  {
    label: "Nova manutenção",
    icon: CirclePlus,
    path: "/os/nova-manutencao-suporte",
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
    label: "Execução",
    icon: ClipboardList,
    path: "/execucao/monitoramento",
    roles: ["monitoramento"],
  },

  {
    label: "Relatórios",
    icon: BarChart3,
    path: "/relatorios",
    roles: ["gestor"],
  },

  {
    label: "Minha conta",
    icon: Settings,
    path: "/minha-conta",
  },
];
