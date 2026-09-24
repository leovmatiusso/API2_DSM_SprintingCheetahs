import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovaOrdemServico from "@/templates/comercial/NovaOrdemServico";
import NovaManutencao from "@/templates/suporte/NovaManutencao";

export const suporteRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["suporte"]} />}>
    <Route path="/os/nova-os" element={<NovaOrdemServico tipo="manutencao" />} />
    <Route path="/os/nova-manutencao-suporte" element={<NovaManutencao />} />
  </Route>
);
