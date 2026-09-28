import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovaManutencao from "@/templates/suporte/NovaManutencao";
import ManutencoesTotais from "@/templates/suporte/ManutencoesTotais";

export const suporteRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["suporte"]} />}>
    <Route path="/os/nova-manutencao-suporte" element={<NovaManutencao />} />

    <Route path="/manutencoes-totais" element={<ManutencoesTotais tipo="manutencao" />} />
  </Route>
);