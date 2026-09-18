import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "@/templates/Dashboard";
import MinhaConta from "@/templates/MinhaConta";
import Cadastro from "@/templates/Cadastro";
import MinhasOS from "@/templates/MinhasOS";

export const compartilhadasRoutes = (
  <>
    {/* Rotas de todos os usuários */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/minha-conta" element={<MinhaConta />} />

    {/* Rotas do Superusuário e Gestor */}
    <Route
      element={<ProtectedRoute allowedRoles={["superusuario", "gestor"]} />}
    >
      <Route path="/cadastro" element={<Cadastro />} />
    </Route>

    {/* Rotas do Comercial, Suporte, Produção, Software e Implantação */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[
            "comercial",
            "suporte",
            "producao",
            "software",
            "implantacao",
          ]}
        />
      }
    >
      <Route path="/os/minhas" element={<MinhasOS />} />
    </Route>
  </>
);
