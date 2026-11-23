import { getCurrentUser } from "@/auth";
import DashboardOperacional from "./DashboardOperacional";
import DashboardGeral from "./Dashboard";

export default function DashboardHome() {
  const user = getCurrentUser();
  if (user?.role === "suporte") return <DashboardOperacional tipo="suporte" />;
  if (user?.role === "comercial") return <DashboardOperacional tipo="comercial" />;
  return <DashboardGeral />;
}
