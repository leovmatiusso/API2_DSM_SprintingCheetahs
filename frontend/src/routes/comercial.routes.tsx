import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import NovoProjeto from "@/templates/comercial/NovoProjeto";

export const comercialRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["comercial", "superusuario"]} />}>
    <Route path="/novo-projeto" element={<NovoProjeto />} />
  </Route>
);
