import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <aside
      className={`
        relative flex h-screen shrink-0 flex-col
        border-r border-text/10 bg-surface
        transition-all duration-300 text-nowrap p-3
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Cabeçalho */}
      <div className="flex h-16 items-center px-2">
        {!collapsed && (
          <h1 className="text-lg font-bold">
            Minha aplicação
          </h1>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              {...item}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Botão da seta */}
      <button
        onClick={toggleSidebar}
        className="
          absolute right-0 top-6
          flex size-7 translate-x-1/2
          items-center justify-center
          rounded-full border border-text/10
          bg-surface
          text-text-muted
          shadow-sm
          transition-colors
          hover:bg-background
          hover:text-text
        "
        aria-label={
          collapsed
            ? "Abrir sidebar"
            : "Fechar sidebar"
        }
      >
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>

      <ThemeToggle />
    </aside>
  );
}