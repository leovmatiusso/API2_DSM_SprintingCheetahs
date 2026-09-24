import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovaOrdemServico from "@/templates/comercial/NovaOrdemServico";

export const comercialRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["comercial"]} />}>
    <Route path="/os/nova-os" element={<NovaOrdemServico tipo="novo-projeto" />} />
  </Route>
);
