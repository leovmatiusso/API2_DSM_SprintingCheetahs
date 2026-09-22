import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovaOrdemServico from "@/templates/NovaOrdemServico";

export const suporteRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["suporte"]} />}>
    <Route
      path="/os/nova-manutencao"
      element={
        <NovaOrdemServico tipo="manutencao" />
      }
    />
  </Route>
);