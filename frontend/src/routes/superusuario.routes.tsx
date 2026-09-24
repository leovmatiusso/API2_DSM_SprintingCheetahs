import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";

import Modulo from "@/templates/Modulo";

import Times from "@/templates/superusuario/Times";
import Usuarios from "@/templates/superusuario/Usuarios";

export const superusuarioRoutes = (
  <>
    <Route element={<ProtectedRoute allowedRoles={["superusuario", "gestor"]} />}>
      <Route path="/usuarios" element={<Usuarios />} />

      <Route path="/times" element={<Times />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["superusuario"]} />}>
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
  </>
);
