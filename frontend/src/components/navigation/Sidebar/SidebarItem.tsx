
import { NavLink } from "react-router-dom";
import type { SidebarItemConfig } from "./sidebar.types";

interface SidebarItemProps extends SidebarItemConfig {
  collapsed: boolean;
}

export default function SidebarItem({ label, icon: Icon, path, collapsed }: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-all justify-start ${
          isActive
            ? "bg-primary-muted text-primary"
            : "text-text-muted hover:bg-primary-muted/50 hover:text-text-muted"
        }`
      }
    >
      <Icon size={20} className="shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

