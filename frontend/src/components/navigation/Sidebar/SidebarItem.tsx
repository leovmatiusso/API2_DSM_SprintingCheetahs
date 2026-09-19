import { NavLink } from "react-router-dom";
import type { SidebarItemConfig } from "./sidebar.types";

interface SidebarItemProps extends SidebarItemConfig {
  collapsed: boolean;
}

export default function SidebarItem({
  label,
  icon: Icon,
  path,
  collapsed,
}: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `
          flex items-center gap-3 rounded-r-lg ${collapsed ? "p-2.5 pl-6" : "pl-6 py-2.5"}
          text-sm font-medium transition-all
          ${
            isActive
              ? `bg-primary/15 text-primary ${collapsed ? "" : "border-l-6"}`
              : "text-text-muted hover:bg-bg-secondary"
          }
        `
      }
    >
      <Icon size={19} aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
