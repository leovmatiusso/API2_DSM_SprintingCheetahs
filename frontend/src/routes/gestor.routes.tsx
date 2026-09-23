import { Route } from "react-router-dom";

import Modulo from "@/templates/Modulo";
import Dashboard from "@/templates/gestor/Dashboard";

import ProtectedRoute from "@/components/ProtectedRoute";

export const gestorRoutes = (
  <Route element={<ProtectedRoute allowedRoles={["gestor"]} />}>
    
    <Route path="/dashboard/gestor" element={<Dashboard />} />

    <Route
      path="/os/disponiveis"
      element={
        <Modulo
          title="Ordens de Serviço disponíveis"
          description="Tela de gestão das O.S. que aguardam análise, priorização ou encaminhamento."
          items={[
            "Visualizar O.S. abertas",
            "Filtrar por status, prioridade, cliente e tipo",
            "Alterar prioridade",
            "Atribuir O.S. à Produção, Software ou Implantação",
            "Acompanhar O.S. atrasadas",
          ]}
        />
      }
    />

    <Route
      path="/projetos"
      element={
        <Modulo
          title="Projetos"
          description="Consulta dos projetos dos clientes e das O.S. relacionadas a cada projeto."
          items={[
            "Consultar projetos",
            "Visualizar O.S. vinculadas",
            "Acompanhar histórico do projeto",
            "Identificar equipamentos e atendimentos anteriores",
          ]}
        />
      }
    />

    <Route
      path="/equipes-gestao"
      element={
        <Modulo
          title="Gestão de equipes"
          description="Tela operacional para acompanhar equipes e distribuir trabalho."
          items={[
            "Visualizar equipes",
            "Consultar usuários de cada equipe",
            "Acompanhar O.S. atribuídas",
            "Organizar responsáveis",
          ]}
        />
      }
    />

    <Route
      path="/relatorios"
      element={
        <Modulo
          title="Relatórios"
          description="Área para indicadores e relatórios gerenciais das O.S."
          items={[
            "O.S. por status",
            "O.S. por equipe",
            "O.S. atrasadas",
            "Materiais e serviços lançados",
            "Totais por período e setor",
          ]}
        />
      }
    />

    <Route
      path="/auditoria-gestor"
      element={
        <Modulo
          title="Auditoria"
          description="Consulta dos registros de alterações relevantes feitas nas O.S. e na operação."
          items={[
            "Quem alterou uma O.S.",
            "Alterações de prioridade",
            "Encaminhamentos entre equipes",
            "Alterações de status e lançamentos",
          ]}
        />
      }
    />
  </Route>
);
