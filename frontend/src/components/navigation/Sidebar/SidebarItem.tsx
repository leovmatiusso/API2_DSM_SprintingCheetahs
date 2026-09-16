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
        `sidebar-item ${isActive ? "sidebar-item--active" : ""} ${collapsed ? "sidebar-item--collapsed" : ""}`
      }
    >
      <Icon size={19} aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
