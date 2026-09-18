import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";

import Usuarios from "@/templates/Usuarios";
import Modulo from "@/templates/Modulo";

export const superusuarioRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["superusuario"]} />}>
      <Route path="/usuarios" element={<Usuarios />} />

      <Route
        path="/auditoria"
        element={
          <Modulo
            title="Auditoria do sistema"
            description="Histórico das ações realizadas pelos usuários no sistema."
            items={[
              "Filtrar ações por usuário, data e tipo",
              "Consultar alterações de contas e permissões",
              "Visualizar registros relacionados às O.S.",
              "Manter rastreabilidade das operações",
            ]}
          />
        }
      />

      <Route
        path="/equipes"
        element={
          <Modulo
            title="Equipes"
            description="Cadastro e organização das equipes que participam do fluxo das O.S."
            items={[
              "Cadastrar equipes",
              "Adicionar ou remover usuários das equipes",
              "Definir responsáveis",
              "Visualizar composição das equipes",
            ]}
          />
        }
      />
  </Route>
);