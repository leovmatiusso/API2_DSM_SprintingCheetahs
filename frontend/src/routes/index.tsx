import { Navigate, Route, Routes } from "react-router-dom";

import { getCurrentUser } from "@/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";

import { authRoutes } from "./auth.routes";
import { compartilhadasRoutes } from "./compartilhadas.routes";
import { superusuarioRoutes } from "./superusuario.routes";
import { gestorRoutes } from "./gestor.routes";
import { comercialRoutes } from "./comercial.routes";
import { suporteRoutes } from "./suporte.routes";
import { producaoRoutes } from "./producao.routes";
import { softwareRoutes } from "./software.routes";
import { implantacaoRoutes } from "./implantacao.routes";

export default function AppRoutes() {
  const user = getCurrentUser();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />

      {authRoutes}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {compartilhadasRoutes}

          {superusuarioRoutes}
          {gestorRoutes}
          {comercialRoutes}
          {suporteRoutes}
          {producaoRoutes}
          {softwareRoutes}
          {implantacaoRoutes}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
