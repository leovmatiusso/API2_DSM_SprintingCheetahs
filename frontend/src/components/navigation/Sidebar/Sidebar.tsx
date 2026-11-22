import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/auth";
import SidebarItem from "./SidebarItem";
import { menuItems } from "./sidebar.config";
import ThemeToggle from "./ThemeToggle";
import HiveIcon from "./HiveIcon";

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

// Em telas pequenas a sidebar fica recolhida (só ícones) e, quando expandida,
// ocupa a tela inteira por cima do conteúdo; ao escolher um item ela fecha sozinha.
const CONSULTA_TELA_PEQUENA = "(max-width: 767px)";

function telaPequena(): boolean {
  return typeof window !== "undefined" && window.matchMedia(CONSULTA_TELA_PEQUENA).matches;
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const [pequena, setPequena] = useState(telaPequena);
  const [collapsed, setCollapsed] = useState(telaPequena);
  const sobreposta = pequena && !collapsed;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_TELA_PEQUENA);
    const atualizar = () => {
      setPequena(consulta.matches);
      if (consulta.matches) setCollapsed(true);
    };
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  // No celular, trocar de tela fecha o menu.
  useEffect(() => {
    if (telaPequena()) setCollapsed(true);
  }, [location.pathname]);

  // Com o menu aberto por cima de tudo, a página de trás não rola.
  useEffect(() => {
    if (!sobreposta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [sobreposta]);
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

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  const posicao = pequena
    ? `fixed top-0 left-0 z-50 ${collapsed ? "w-16" : "w-full"}`
    : `sticky top-0 self-start ${collapsed ? "w-16" : "w-64"}`;

  return (
    <>
    {/* No celular a sidebar fica fixa; este espaço mantém o conteúdo ao lado dos ícones. */}
    {pequena && <div className="w-16 shrink-0" aria-hidden="true" />}
    <aside
      className={`bg-bg border-border flex h-dvh shrink-0 flex-col gap-6 border-r text-nowrap transition-all duration-300 ${posicao}`}
    >
      <div className={`flex h-fit items-center justify-center px-3 w-full ${collapsed ? "mb-7" : "mb-12"} transition-all duration-300`}>
        <div className={`flex items-center gap-3 justify-start w-full`}>
          <HiveIcon className={`${collapsed ? "size-10" : "size-12"} p-2 text-primary shrink-0 bg-primary-muted rounded-2xl transition-all duration-300`} />
          <span className="text-xl font-semibold text-text truncate">Hive</span>
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
        className={`bg-bg border-border text-text-muted absolute top-6 inline-flex size-7 cursor-pointer items-center justify-center rounded-2xl border p-0 shadow-sm ${
          sobreposta ? "right-4" : "right-0 translate-x-1/2"
        }`}
        onClick={handleCollapse}
        aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
    </>
  );
}

