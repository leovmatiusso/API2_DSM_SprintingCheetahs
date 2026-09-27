import {
  BarChart3,
  ClipboardList,
  FilePlus2,
  Home,
  Settings,
  Users,
  UserRoundPlus,
  CirclePlus,
  LayersPlus,
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
    icon: Users,
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
    icon: ClipboardList,
    path: "/os/disponiveis",
    roles: ["gestor"],
  },

  {
    label: "Projetos",
    icon: ClipboardList,
    path: "/projetos-totais",
    roles: ["comercial"],
  },

  {
    label: "Manutenções",
    icon: Wrench,
    path: "/manutencoes-totais",
    roles: ["suporte"],
  },

  {
    label: "Minhas O.S.",
    icon: ClipboardList,
    path: "/os/minhas",
    roles: ["producao", "software", "implantacao"],
  },

  {
    label: "Nova O.S.",
    icon: FilePlus2,
    path: "/os/nova-os",
    roles: ["comercial"],
  },

  {
    label: "Novo projeto",
    icon: CirclePlus,
    path: "/novo-projeto",
    roles: ["comercial"],
  },
  
  {
    label: "Nova OS",
    icon: FilePlus2,
    path: "/os/nova-os",
    roles: ["suporte"],
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

  {
    label: "Cadastrar Times",
    icon: UserRoundPlus,
    path: "/cadastro-times",
    roles: ["superusuario", "gestor"],
  },


  {
    label: "Minha conta",
    icon: Settings,
    path: "/minha-conta",
  },
];
