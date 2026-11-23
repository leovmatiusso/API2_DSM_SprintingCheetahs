import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovaManutencao from "@/templates/suporte/NovaManutencao";

export const suporteRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["suporte", "superusuario"]} />}>
    <Route path="/os/nova-manutencao-suporte" element={<NovaManutencao />} />
  </Route>
);
