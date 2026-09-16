import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../../auth";
import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const visibleItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`app-sidebar ${collapsed ? "app-sidebar--collapsed" : ""}`}>
      <div className="app-sidebar__brand">
        {!collapsed && (
          <div>
            <strong>Sistema O.S.</strong>
            <span>Gestão operacional</span>
          </div>
        )}
      </div>

      <nav className="app-sidebar__nav" aria-label="Navegação principal">
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <ThemeToggle />
      </div>

      <button
        type="button"
        className="app-sidebar__toggle"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
        title={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
