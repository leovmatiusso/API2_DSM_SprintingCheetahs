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
    <aside className={`relative bg-bg flex flex-col h-dvh shrink-0 gap-6 px-0 py-5 border-r border-text/15 transition-all duration-300 text-nowrap ${collapsed ? "w-16" : "w-64"}`}>
      <div className="min-h-11 px-2.5 py-1 overflow-hidden whitespace-nowrap">
        {!collapsed && (
          <div className="px-3">
            <strong className="text-subtitle block">Sistema O.S.</strong>
            <span className="mt-3 text-text-muted text-small block">Gestão operacional</span>
          </div>
        )}
      </div>

      <nav className="flex-1 grid content-start gap-1.5 pr-3" aria-label="Navegação principal">
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="flex items-center gap-1 p-3 border-t border-text/15">
        <ThemeToggle />
      </div>

      <button
        type="button"
        className="cursor-pointer absolute top-6 right-0 inline-flex size-7 items-center justify-center p-0 translate-x-1/2 rounded-2xl bg-bg border border-text/15 text-text-muted shadow-sm"
        onClick={() => setCollapsed((current) => !current)}
        aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
        title={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
