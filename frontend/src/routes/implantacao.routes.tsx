import { Route } from "react-router-dom";

import Modulo from "@/templates/Modulo";

import ProtectedRoute from "@/components/ProtectedRoute";

export const implantacaoRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["implantacao"]} />}>
    <Route
      path="/execucao/implantacao"
      element={
        <Modulo
          title="Execução — Implantação"
          description="Área de trabalho para instalação ou manutenção no local do cliente."
          items={[
            "Registrar atendimento realizado",
            "Lançar peças/materiais e serviços",
            "Registrar testes e resultado",
            "Anexar laudo em PDF",
            "Concluir atendimento",
          ]}
        />
      }
    />
  </Route>
);
