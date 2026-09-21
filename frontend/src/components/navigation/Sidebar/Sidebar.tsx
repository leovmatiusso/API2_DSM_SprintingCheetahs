import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  logout
} from "../../../auth";
import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  onCollapsedChange?: (
    collapsed: boolean
  ) => void;
}

export default function Sidebar({
  onCollapsedChange
}: SidebarProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  const visibleItems =
    menuItems.filter(
      item =>
        !item.roles ||
        (user &&
          item.roles.includes(
            user.role
          ))
    );

  function handleCollapse() {
    setCollapsed(current => {
      const next = !current;

      onCollapsedChange?.(next);

      return next;
    });
  }

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true
    });
  }

  return (
    <aside
      className={`
        fixed
        top-0
        left-0
        z-50
        bg-bg
        flex
        flex-col
        h-dvh
        shrink-0
        gap-6
        px-0
        py-5
        border-r
        border-text/15
        transition-all
        duration-300
        text-nowrap

        ${
          collapsed
            ? "w-16"
            : "w-57"
        }
      `}
    >
      <div className="min-h-11 px-2.5 py-1 overflow-hidden whitespace-nowrap">
        {!collapsed && (
          <div className="px-3">
            <strong className="text-subtitle block">
              Sistema O.S.
            </strong>

            <span className="mt-3 text-text-muted text-small block">
              Gestão operacional
            </span>
          </div>
        )}
      </div>

      <nav
        className="flex-1 grid content-start gap-1.5 pr-3 overflow-y-auto overflow-x-hidden"
        aria-label="Navegação principal"
      >
        {visibleItems.map(item => (
          <SidebarItem
            key={item.path}
            {...item}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="flex items-center gap-1 p-3 border-t border-text/15">
        <ThemeToggle />

        {!collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto px-3 py-2 text-sm rounded-lg text-text-muted hover:bg-text/5"
          >
            Sair
          </button>
        )}
      </div>

      <button
        type="button"
        className="
          cursor-pointer
          absolute
          top-6
          right-0
          inline-flex
          size-7
          items-center
          justify-center
          p-0
          translate-x-1/2
          rounded-2xl
          bg-bg
          border
          border-text/15
          text-text-muted
          shadow-sm
        "
        onClick={handleCollapse}
        aria-label={
          collapsed
            ? "Abrir menu"
            : "Fechar menu"
        }
        title={
          collapsed
            ? "Abrir menu"
            : "Fechar menu"
        }
      >
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>
    </aside>
  );
}