import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { OrdemServicoResumo } from "@/api";
import { atualizarStatusOS } from "@/api";
import { getCurrentUser } from "@/auth";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import { PRIORIDADE_CLASSE, PRIORIDADE_LABEL, formatarData, isTimeMonitoramento } from "./osEstilos";
import SeletorStatusOS from "./SeletorStatusOS";

// Colunas da visualização em lista (cabeçalho e linhas usam as mesmas).
// Abaixo de xl (com a sidebar aberta sobra pouco espaço) cada O.S. vira um bloco com rótulos.
export const COLUNAS_LISTA_OS =
  "xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_6.5rem_8.5rem_6.5rem_6.5rem]";

function Celula({ rotulo, className = "", children }: { rotulo: string; className?: string; children: ReactNode }) {
  return (
    <span className={`flex min-w-0 flex-col gap-0.5 ${className}`}>
      <span className="text-text-muted text-xs xl:hidden">{rotulo}</span>
      {children}
    </span>
  );
}

// Cabeçalho fixo da visualização em lista das O.S.
export function CabecalhoListaOS() {
  return (
    <div
      className={`bg-primary-muted text-primary sticky top-0 z-10 hidden items-center gap-x-4 rounded-lg px-4 py-2.5 text-sm font-semibold xl:grid ${COLUNAS_LISTA_OS}`}
    >
      <span>O.S. Título</span>
      <span>Time responsável</span>
      <span>Departamento</span>
      <span className="text-center">Prioridade</span>
      <span className="text-center">Status</span>
      <span className="text-center">Data de abertura</span>
      <span className="text-center">Data de entrega</span>
    </div>
  );
}

// O.S. em ticket (cartão) ou em linha de lista - ao clicar abre a O.S. expandida.
// Nos dois formatos o status mantém o seletor com a lista de opções.
export default function OrdemTicket({
  os,
  onStatusChange,
  formato = "ticket",
}: {
  os: OrdemServicoResumo;
  onStatusChange?: (status: OrdemServicoResumo["status"]) => void;
  formato?: "ticket" | "lista";
}) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const responsavelDoTime = Boolean(
    currentUser?.id && os.time?.responsavel_id === currentUser.id,
  );
  const [status, setStatus] = useState(os.status);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterarStatus(novoStatus: typeof os.status) {
    setErro(null);
    setSalvando(true);
    try {
      await atualizarStatusOS(os.id, novoStatus);
      setStatus(novoStatus);
      onStatusChange?.(novoStatus);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setSalvando(false);
    }
  }

  const abrir = () => navigate(`/os/disponiveis/${os.id}`);
  const prioridade = (
    <Selo classe={PRIORIDADE_CLASSE[os.prioridade]}>
      {PRIORIDADE_LABEL[os.prioridade] ?? os.prioridade}
    </Selo>
  );
  const seletorStatus = (
    <SeletorStatusOS
      status={status}
      responsavelDoTime={responsavelDoTime}
      timeMonitoramento={isTimeMonitoramento(os.departamento)}
      superusuario={currentUser?.role === "superusuario"}
      disabled={salvando}
      onChange={alterarStatus}
    />
  );
  const mensagemErro = erro && (
    <span className="text-danger block text-xs" role="alert">{erro}</span>
  );

  if (formato === "lista") {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Abrir ${os.titulo}`}
        onClick={abrir}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            abrir();
          }
        }}
        className={`nova-os-card border-border grid cursor-pointer grid-cols-2 items-center gap-x-4 gap-y-3 rounded-lg border px-4 py-3 text-left text-sm shadow-sm transition hover:shadow-md sm:grid-cols-3 xl:gap-y-2 xl:py-2.5 ${COLUNAS_LISTA_OS}`}
      >
        <span className="text-text col-span-2 truncate font-semibold sm:col-span-3 xl:col-span-1 xl:font-medium" title={os.titulo}>
          {os.titulo}
        </span>
        <Celula rotulo="Time responsável">
          <span className="text-text truncate">{os.time?.nome ?? "—"}</span>
        </Celula>
        <Celula rotulo="Departamento">
          <span className="text-text truncate">{os.departamento ?? "—"}</span>
        </Celula>
        <Celula rotulo="Prioridade" className="items-start xl:items-center">
          {prioridade}
        </Celula>
        <Celula rotulo="Status" className="items-start xl:items-center">
          {seletorStatus}
        </Celula>
        <Celula rotulo="Data de abertura" className="xl:items-center">
          <span className="text-text">{formatarData(os.data_criacao)}</span>
        </Celula>
        <Celula rotulo="Data de entrega" className="xl:items-center">
          <span className="text-text">{formatarData(os.data_limite)}</span>
        </Celula>
        {mensagemErro && <span className="col-span-full">{mensagemErro}</span>}
      </div>
    );
  }

  return (
    <Ticket titulo={os.titulo} onClick={abrir}>
      <TicketLinha rotulo="Time">
        <span className="font-normal">{os.time?.nome ?? "—"}</span>
      </TicketLinha>
      <TicketLinha rotulo="Departamento">
        <span className="font-normal">{os.departamento ?? "—"}</span>
      </TicketLinha>
      <TicketLinha rotulo="Prioridade">{prioridade}</TicketLinha>
      <TicketLinha rotulo="Status">{seletorStatus}</TicketLinha>
      {mensagemErro}
    </Ticket>
  );
}
