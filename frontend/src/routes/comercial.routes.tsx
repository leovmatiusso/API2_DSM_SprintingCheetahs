import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";
import Modulo from "@/templates/Modulo";

export const comercialRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["comercial"]} />}>
    <Route
      path="/os/nova-projeto"
      element={
        <Modulo
          title="Nova Ordem de Serviço — Novo Projeto"
          description="Tela onde o Comercial registra uma solicitação de novo produto ou projeto recebida do cliente."
          items={[
            "Cadastrar cliente e dados iniciais",
            "Descrever a solicitação",
            "Informar itens inicialmente necessários",
            "Anexar documentos",
            "Enviar a solicitação para o Gestor",
          ]}
        />
      }
    />
  </Route>
);
