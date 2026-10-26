import { Route } from "react-router-dom";

import Modulo from "@/templates/Modulo";

import ProtectedRoute from "@/components/ProtectedRoute";

export const monitoramentoRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["monitoramento"]} />}>
    <Route
      path="/execucao/monitoramento"
      element={
        <Modulo
          title="Execução — Monitoramento"
          description="Área de trabalho para acompanhamento e monitoramento dos sistemas e equipamentos."
          items={[
            "Visualizar O.S. atribuídas",
            "Acompanhar sistemas e equipamentos",
            "Registrar ocorrências e testes",
            "Atualizar andamento",
            "Concluir atendimento",
          ]}
        />
      }
    />
  </Route>
);
