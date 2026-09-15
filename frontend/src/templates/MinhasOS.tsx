import "../style/MinhasOS.css";
import Modulo from "./Modulo";
import { getCurrentUser } from "../auth";
import type { Role } from "../types";

const data: Partial<Record<Role, {title:string; description:string; items:string[]}>> = {
  comercial: { title:"Minhas Ordens de Serviço — Comercial", description:"Acompanhamento das O.S. de novos projetos abertas pelo usuário Comercial.", items:["Consultar O.S. abertas pelo usuário", "Acompanhar status e etapa atual", "Visualizar histórico", "Consultar informações e anexos permitidos"] },
  suporte: { title:"Minhas Ordens de Serviço — Suporte", description:"Acompanhamento das O.S. de manutenção abertas pelo usuário de Suporte.", items:["Consultar chamados registrados", "Acompanhar andamento", "Visualizar equipe responsável", "Consultar histórico do atendimento"] },
  producao: { title:"Minhas Ordens de Serviço — Produção", description:"O.S. encaminhadas para a equipe de Produção.", items:["Visualizar O.S. atribuídas", "Abrir detalhes da demanda", "Iniciar montagem/configuração", "Registrar peças e materiais usados", "Concluir etapa de Produção"] },
  software: { title:"Minhas Ordens de Serviço — Software", description:"O.S. encaminhadas para desenvolvimento ou configuração de software.", items:["Visualizar O.S. atribuídas", "Consultar requisitos", "Registrar desenvolvimento/configuração", "Registrar testes e validação", "Concluir desenvolvimento"] },
  implantacao: { title:"Minhas Ordens de Serviço — Implantação", description:"O.S. encaminhadas para instalação ou manutenção no cliente.", items:["Visualizar O.S. atribuídas", "Consultar endereço e dados do cliente", "Abrir atendimento", "Atualizar andamento", "Consultar histórico"] }
};
export default function MinhasOS(){ const user=getCurrentUser(); if(!user) return null; const d=data[user.role]; if(!d) return null; return <Modulo {...d} pageClassName="minhas-os-page"/>; }
