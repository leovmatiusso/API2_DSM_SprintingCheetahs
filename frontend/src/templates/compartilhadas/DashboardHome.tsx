import { getCurrentUser } from "@/auth";
import DashboardOperacional from "./DashboardOperacional";
import DashboardGeral from "./Dashboard";
import DashboardGestor from "@/templates/gestor/Dashboard";

export default function DashboardHome() {
  const user = getCurrentUser();
  if (user?.role === "superusuario") return <DashboardGestor />;
  if (user?.role === "suporte") return <DashboardOperacional tipo="suporte" />;
  if (user?.role === "comercial") return <DashboardOperacional tipo="comercial" />;
  return <DashboardGeral />;
}
