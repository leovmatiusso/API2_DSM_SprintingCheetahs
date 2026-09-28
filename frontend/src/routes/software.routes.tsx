import { Route } from "react-router-dom";

import Modulo from "@/templates/Modulo";

import ProtectedRoute from "@/components/ProtectedRoute";

export const softwareRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["software"]} />}>
    <Route
      path="/execucao/software"
      element={
        <Modulo
          title="Execução — Software"
          description="Área de trabalho para desenvolvimento, configuração e testes do software."
          items={[
            "Consultar requisitos da O.S.",
            "Registrar desenvolvimento",
            "Informar versão/configuração",
            "Registrar testes e validação",
            "Encaminhar para a próxima etapa",
          ]}
        />
      }
    />
  </Route>
);
