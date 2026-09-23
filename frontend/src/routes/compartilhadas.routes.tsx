import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

import Dashboard from "@/templates/compartilhadas/Dashboard";
import MinhaConta from "@/templates/compartilhadas/MinhaConta";
import Cadastro from "@/templates/compartilhadas/Cadastro";
import CadastroTimes from "@/templates/compartilhadas/CadastroTimes";
import MinhasOS from "@/templates/compartilhadas/MinhasOS";

export const compartilhadasRoutes = (
  <>
    <Route
      path="/dashboard"
      element={<Dashboard />}
    />

    <Route
      path="/minha-conta"
      element={<MinhaConta />}
    />

    <Route
      element={
        <ProtectedRoute
          allowedRoles={[
            "superusuario",
            "gestor"
          ]}
        />
      }
    >
      <Route
        path="/cadastro"
        element={<Cadastro />}
      />

      <Route
        path="/cadastro-times"
        element={<CadastroTimes />}
      />
    </Route>

    <Route
      element={
        <ProtectedRoute
          allowedRoles={[
            "comercial",
            "suporte",
            "producao",
            "software",
            "implantacao"
          ]}
        />
      }
    >
      <Route
        path="/os/minhas"
        element={<MinhasOS />}
      />
    </Route>
  </>
);