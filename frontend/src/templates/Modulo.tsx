import "@/style/Modulo.css";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/auth";
import Button from "@/components/ui/Button";

export interface ModuloProps {
  title: string;
  description: string;
  items?: string[];
  pageClassName?: string;
}

export default function Modulo({ title, description, items = [], pageClassName = "" }: ModuloProps) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  if (!user) return null;
  function sair() { logout(); navigate("/login", { replace: true }); }
  return <main className={`page ${pageClassName}`.trim()}>
    <header className="topbar">
      <div><strong>Sistema de O.S.</strong><span className="role-badge">{user.role}</span></div>
      <nav className="nav-actions">
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        <Button variant="secondary" onClick={() => navigate("/minha-conta")}>
              Minha conta
            </Button>
            {user.role === "superusuario" && <Button variant="secondary" onClick={() => navigate("/usuarios")}>Usuários</Button>}
            <Button variant="secondary" onClick={sair}>
              Sair
            </Button>
      </nav>
    </header>
    <section className="card content">
      <div className="module-heading"><div><p className="eyebrow">Navegação / protótipo</p><h1>{title}</h1></div><span className="text-xs bg-secondary px-3 py-2 rounded-full whitespace-nowrap">Somente navegação</span></div>
      <p className="module-description">{description}</p>
      {items.length > 0 && <div className="future-list"><h2>O que será desenvolvido nesta tela</h2><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></div>}
      <div className="info">Esta versão serve como base visual e de navegação. As operações reais serão implementadas nas próximas etapas.</div>
    </section>
  </main>;
}
