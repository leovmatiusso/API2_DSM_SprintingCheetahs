import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import Modulo from "@/templates/Modulo";

export const suporteRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["suporte"]} />}>
    <Route
      path="/os/nova-manutencao"
      element={
        <Modulo
          title="Nova Ordem de Serviço — Manutenção"
          description="Tela onde o Suporte registra o chamado do cliente para manutenção de um projeto já existente."
          items={[
            "Selecionar cliente e projeto existente",
            "Registrar equipamento/local",
            "Descrever problema e relato do cliente",
            "Anexar evidências",
            "Enviar a solicitação para o Gestor",
          ]}
        />
      }
    />
  </Route>
);
