import "../style/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth";
import type { Role } from "../types";

const labels: Record<Role, string> = {
  superusuario: "Superusuário", gestor: "Gestor", comercial: "Comercial", suporte: "Suporte",
  producao: "Produção", software: "Software", implantacao: "Implantação"
};

const descriptions: Record<Role, string> = {
  superusuario: "Administre usuários, contas e permissões do sistema.",
  gestor: "Gerencie as ordens de serviço, prioridades, equipes e atribuições.",
  comercial: "Abra solicitações de novos projetos e acompanhe as O.S. criadas por você.",
  suporte: "Abra solicitações de manutenção e acompanhe os atendimentos registrados por você.",
  producao: "Consulte as O.S. atribuídas à Produção e registre montagem, configuração e materiais.",
  software: "Consulte as O.S. atribuídas ao Software e registre desenvolvimento e testes.",
  implantacao: "Consulte as O.S. atribuídas à Implantação, registre o atendimento e anexe o laudo."
};

type Item = { label: string; path: string; description: string };
const menus: Record<Role, Item[]> = {
  superusuario: [
    { label: "Gerenciar usuários", path: "/usuarios", description: "Criar, editar, ativar, desativar, excluir contas e alterar perfis." },
    { label: "Equipes", path: "/equipes", description: "Organização das equipes e seus usuários." },
    { label: "Auditoria", path: "/auditoria", description: "Histórico administrativo e rastreabilidade do sistema." }
  ],
  gestor: [
    { label: "Ordens de Serviço disponíveis", path: "/os/disponiveis", description: "Visualizar, priorizar e encaminhar O.S." },
    { label: "Projetos", path: "/projetos", description: "Projetos e O.S. relacionadas." },
    { label: "Gestão de equipes", path: "/equipes-gestao", description: "Acompanhar equipes e distribuição do trabalho." },
    { label: "Relatórios", path: "/relatorios", description: "Indicadores e relatórios gerenciais." },
    { label: "Auditoria", path: "/auditoria-gestor", description: "Histórico das alterações operacionais." }
  ],
  comercial: [
    { label: "Nova O.S. — Novo Projeto", path: "/os/nova-projeto", description: "Registrar pedido de novo produto/projeto." },
    { label: "Minhas O.S.", path: "/os/minhas", description: "Acompanhar as solicitações abertas por você." }
  ],
  suporte: [
    { label: "Nova O.S. — Manutenção", path: "/os/nova-manutencao", description: "Registrar relato de problema/manutenção." },
    { label: "Minhas O.S.", path: "/os/minhas", description: "Acompanhar os chamados abertos por você." }
  ],
  producao: [
    { label: "Minhas O.S.", path: "/os/minhas", description: "O.S. atribuídas à Produção." },
    { label: "Execução — Produção", path: "/execucao/producao", description: "Montagem, configuração e lançamentos." }
  ],
  software: [
    { label: "Minhas O.S.", path: "/os/minhas", description: "O.S. atribuídas ao Software." },
    { label: "Execução — Software", path: "/execucao/software", description: "Desenvolvimento, configuração e testes." }
  ],
  implantacao: [
    { label: "Minhas O.S.", path: "/os/minhas", description: "O.S. atribuídas à Implantação." },
    { label: "Execução — Implantação", path: "/execucao/implantacao", description: "Atendimento no cliente, materiais e laudo." }
  ]
};

export default function Dashboard() {
  const navigate = useNavigate(); const user = getCurrentUser();
  if (!user) return null;
  function sair() { logout(); navigate("/login", { replace: true }); }
  return <main className="page">
    <header className="topbar"><div><strong>Sistema de O.S.</strong><span className="role-badge">{labels[user.role]}</span></div>
      <nav className="nav-actions"><button className="secondary" onClick={() => navigate("/minha-conta")}>Minha conta</button><button className="secondary" onClick={sair}>Sair</button></nav>
    </header>
    <section className="card content"><p className="eyebrow">Painel inicial</p><h1>Olá, {user.name}</h1><p>{descriptions[user.role]}</p>
      <h2 className="dashboard-section-title">Acessos disponíveis</h2>
      <div className="menu-grid">{menus[user.role].map(item => <button key={item.path} className="menu-card" onClick={() => navigate(item.path)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
    </section>
  </main>;
}
