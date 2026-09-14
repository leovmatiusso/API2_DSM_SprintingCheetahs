import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  path: string;
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
      className={({ isActive }) =>
        `
          flex items-center gap-3 rounded-lg ${collapsed ? "p-2.5" : "px-3 py-2.5"}
          text-sm font-medium transition-all
          ${
            isActive
              ? "bg-primary text-white"
              : "text-text-muted hover:bg-background hover:text-text"
          }
        `
      }
    >
      <Icon size={19} />

      {!collapsed && (
        <span>{label}</span>
      )}
    </NavLink>
  );
}