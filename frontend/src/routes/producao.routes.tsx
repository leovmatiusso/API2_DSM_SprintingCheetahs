import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import Modulo from "@/templates/Modulo";

export const producaoRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["producao"]} />}>
    <Route
      path="/execucao/producao"
      element={
        <Modulo
          title="Execução — Produção"
          description="Área de trabalho para montagem e configuração inicial dos equipamentos."
          items={[
            "Consultar dados técnicos da O.S.",
            "Registrar montagem e configuração",
            "Lançar peças/equipamentos e serviços",
            "Registrar observações e anexos",
            "Concluir a etapa e encaminhar para a próxima equipe",
          ]}
        />
      }
    />
  </Route>
);
