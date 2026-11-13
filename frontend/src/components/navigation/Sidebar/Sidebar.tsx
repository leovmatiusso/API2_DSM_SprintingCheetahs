
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/auth";
import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";
import AltaveIcon from "./AltaveIcon";

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  const visibleItems = menuItems
    .filter(
      (item) =>
        (!item.roles || (user && item.roles.includes(user.role))) &&
        (!item.excludedRoles || !user || !item.excludedRoles.includes(user.role)),
    )
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

  return (
    <aside
      className={`bg-bg border-border sticky top-0 hidden h-dvh shrink-0 flex-col items-center gap-6 border-r pt-4 self-start transition-all duration-300 md:flex ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className={`flex h-fit items-center justify-center px-3 w-full ${collapsed ? "mb-7" : "mb-12"} transition-all duration-300`}>
        <div className={`flex items-center gap-3 justify-start w-full`}>
          <AltaveIcon className={`${collapsed ? "size-10" : "size-12"} text-text shrink-0 bg-bg-tertiary rounded-2xl border border-border transition-all duration-300`} />
          <span className="text-xl font-bold text-text truncate">ALTAVE</span>
        </div>
      </div>

      <nav className={`flex w-full flex-col gap-2 px-3`} aria-label="Navegação principal">
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mt-auto w-full border-t border-border p-3">
        <ThemeToggle />
      </div>

      <button
        type="button"
        className="bg-bg border-border text-text-muted absolute top-17 -right-7 flex size-7 -translate-x-1/2 items-center justify-center rounded-full border shadow-sm transition-all"
        onClick={handleCollapse}
        aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

