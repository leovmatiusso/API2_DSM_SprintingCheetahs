import {
  ClipboardList,
  Home,
  Users,
  User,
  ListTodo,
  CirclePlus,
  Wrench,
  Activity,
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
    label: "Histórico de atividade",
    icon: Activity,
    path: "/historico-atividade",
    roles: ["superusuario", "gestor"],
  },

  {
    label: "Ordens disponíveis",
    icon: ListTodo,
    path: "/os/disponiveis",
  },

  {
    label: "Projetos",
    icon: ClipboardList,
    path: "/projetos-totais",
    excludedRoles: ["suporte"],
  },

  {
    label: "Manutenções",
    icon: Wrench,
    path: "/manutencoes-totais",
    excludedRoles: ["comercial"],
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

];
