import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/auth";
import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  const visibleItems = menuItems
    .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
    .map((item) => {
      if (item.label === "Dashboard" && user?.role === "gestor") {
        return {
          ...item,
          path: "/dashboard/gestor",
        };
      }

      return item;
    });

  function handleCollapse() {
    setCollapsed((current) => {
      const next = !current;

      onCollapsedChange?.(next);

      return next;
    });
  }

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <aside
      className={`bg-bg border-border sticky top-0 flex h-dvh shrink-0 flex-col gap-6 self-start border-r text-nowrap transition-all duration-300 ${collapsed ? "w-16" : "w-64"} `}
    >
      <div className="min-h-11 overflow-hidden px-2.5 py-5 whitespace-nowrap">
        {!collapsed && (
          <div className="px-3">
            <strong className="text-subtitle block">Sistema O.S.</strong>

            <span className="text-text-muted text-small mt-3 block">Gestão operacional</span>
          </div>
        )}
      </div>

      <nav className="grid flex-1 content-start gap-1.5 pr-3" aria-label="Navegação principal">
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-border flex items-center gap-1 border-t p-3">
        <ThemeToggle />
      </div>

      {/* Seta de hide/show sidebar */}
      <button
        type="button"
        className="bg-bg border-border text-text-muted absolute top-6 right-0 inline-flex size-7 translate-x-1/2 cursor-pointer items-center justify-center rounded-2xl border p-0 shadow-sm"
        onClick={handleCollapse}
        aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
        title={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
