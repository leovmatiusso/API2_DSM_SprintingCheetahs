import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovoProjeto from "@/templates/comercial/NovoProjeto";
import ProjetosTotais from "@/templates/comercial/ProjetosTotais";

export const comercialRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["comercial"]} />}>
    <Route path="/novo-projeto" element={<NovoProjeto tipo="novo-projeto" />} />

    <Route path="/projetos-totais" element={<ProjetosTotais tipo="projeto" />} />

  </Route>
);