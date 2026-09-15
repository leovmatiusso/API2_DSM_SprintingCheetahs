import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getCurrentUser } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./templates/Login";
import Dashboard from "./templates/Dashboard";
import MinhaConta from "./templates/MinhaConta";
import Usuarios from "./templates/Usuarios";
import Modulo from "./templates/Modulo";
import MinhasOS from "./templates/MinhasOS";

export default function App() {
  const user = getCurrentUser();
  return <Routes>
    <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/minha-conta" element={<MinhaConta />} />
    </Route>

    {/* Administração existente do Superusuário — mantida funcional */}
    <Route element={<ProtectedRoute allowedRoles={["superusuario"]} />}>
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/auditoria" element={<Modulo title="Auditoria do sistema" description="Histórico das ações realizadas pelos usuários no sistema." items={["Filtrar ações por usuário, data e tipo", "Consultar alterações de contas e permissões", "Visualizar registros relacionados às O.S.", "Manter rastreabilidade das operações"]} />} />
      <Route path="/equipes" element={<Modulo title="Equipes" description="Cadastro e organização das equipes que participam do fluxo das O.S." items={["Cadastrar equipes", "Adicionar ou remover usuários das equipes", "Definir responsáveis", "Visualizar composição das equipes"]} />} />
    </Route>

    {/* Gestor */}
    <Route element={<ProtectedRoute allowedRoles={["gestor"]} />}>
      <Route path="/os/disponiveis" element={<Modulo title="Ordens de Serviço disponíveis" description="Tela de gestão das O.S. que aguardam análise, priorização ou encaminhamento." items={["Visualizar O.S. abertas", "Filtrar por status, prioridade, cliente e tipo", "Alterar prioridade", "Atribuir O.S. à Produção, Software ou Implantação", "Acompanhar O.S. atrasadas"]} />} />
      <Route path="/projetos" element={<Modulo title="Projetos" description="Consulta dos projetos dos clientes e das O.S. relacionadas a cada projeto." items={["Consultar projetos", "Visualizar O.S. vinculadas", "Acompanhar histórico do projeto", "Identificar equipamentos e atendimentos anteriores"]} />} />
      <Route path="/equipes-gestao" element={<Modulo title="Gestão de equipes" description="Tela operacional para acompanhar equipes e distribuir trabalho." items={["Visualizar equipes", "Consultar usuários de cada equipe", "Acompanhar O.S. atribuídas", "Organizar responsáveis"]} />} />
      <Route path="/relatorios" element={<Modulo title="Relatórios" description="Área para indicadores e relatórios gerenciais das O.S." items={["O.S. por status", "O.S. por equipe", "O.S. atrasadas", "Materiais e serviços lançados", "Totais por período e setor"]} />} />
      <Route path="/auditoria-gestor" element={<Modulo title="Auditoria" description="Consulta dos registros de alterações relevantes feitas nas O.S. e na operação." items={["Quem alterou uma O.S.", "Alterações de prioridade", "Encaminhamentos entre equipes", "Alterações de status e lançamentos"]} />} />
    </Route>

    {/* Comercial */}
    <Route element={<ProtectedRoute allowedRoles={["comercial"]} />}>
      <Route path="/os/nova-projeto" element={<Modulo title="Nova Ordem de Serviço — Novo Projeto" description="Tela onde o Comercial registra uma solicitação de novo produto ou projeto recebida do cliente." items={["Cadastrar cliente e dados iniciais", "Descrever a solicitação", "Informar itens inicialmente necessários", "Anexar documentos", "Enviar a solicitação para o Gestor"]} />} />
    </Route>

    {/* Suporte */}
    <Route element={<ProtectedRoute allowedRoles={["suporte"]} />}>
      <Route path="/os/nova-manutencao" element={<Modulo title="Nova Ordem de Serviço — Manutenção" description="Tela onde o Suporte registra o chamado do cliente para manutenção de um projeto já existente." items={["Selecionar cliente e projeto existente", "Registrar equipamento/local", "Descrever problema e relato do cliente", "Anexar evidências", "Enviar a solicitação para o Gestor"]} />} />
    </Route>

    {/* O.S. atribuídas às equipes */}
    <Route element={<ProtectedRoute allowedRoles={["comercial", "suporte", "producao", "software", "implantacao"]} />}>
      <Route path="/os/minhas" element={<MinhasOS />} />
    </Route>

    {/* Produção */}
    <Route element={<ProtectedRoute allowedRoles={["producao"]} />}>
      <Route path="/execucao/producao" element={<Modulo title="Execução — Produção" description="Área de trabalho para montagem e configuração inicial dos equipamentos." items={["Consultar dados técnicos da O.S.", "Registrar montagem e configuração", "Lançar peças/equipamentos e serviços", "Registrar observações e anexos", "Concluir a etapa e encaminhar para a próxima equipe"]} />} />
    </Route>

    {/* Software */}
    <Route element={<ProtectedRoute allowedRoles={["software"]} />}>
      <Route path="/execucao/software" element={<Modulo title="Execução — Software" description="Área de trabalho para desenvolvimento, configuração e testes do software." items={["Consultar requisitos da O.S.", "Registrar desenvolvimento", "Informar versão/configuração", "Registrar testes e validação", "Encaminhar para a próxima etapa"]} />} />
    </Route>

    {/* Implantação */}
    <Route element={<ProtectedRoute allowedRoles={["implantacao"]} />}>
      <Route path="/execucao/implantacao" element={<Modulo title="Execução — Implantação" description="Área de trabalho para instalação ou manutenção no local do cliente." items={["Registrar atendimento realizado", "Lançar peças/materiais e serviços", "Registrar testes e resultado", "Anexar laudo em PDF", "Concluir atendimento"]} />} />
    </Route>

    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
  </Routes>;
}
