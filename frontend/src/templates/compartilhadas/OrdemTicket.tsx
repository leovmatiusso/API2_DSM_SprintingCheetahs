import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { OrdemServicoResumo } from "@/api";
import { atualizarStatusOS } from "@/api";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import { PRIORIDADE_CLASSE, PRIORIDADE_LABEL } from "./osEstilos";
import SeletorStatusOS from "./SeletorStatusOS";

// Ticket de uma O.S. - ao clicar abre a O.S. expandida
export default function OrdemTicket({ os }: { os: OrdemServicoResumo }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(os.status);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alterarStatus(novoStatus: typeof os.status) {
    setErro(null);
    setSalvando(true);
    try {
      await atualizarStatusOS(os.id, novoStatus);
      setStatus(novoStatus);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Ticket titulo={os.titulo} onClick={() => navigate(`/os/disponiveis/${os.id}`)}>
      <TicketLinha rotulo="Time">
        <span className="font-normal">{os.time?.nome ?? "—"}</span>
      </TicketLinha>
      <TicketLinha rotulo="Departamento">
        <span className="font-normal">{os.departamento ?? "—"}</span>
      </TicketLinha>
      <TicketLinha rotulo="Prioridade">
        <Selo classe={PRIORIDADE_CLASSE[os.prioridade]}>
          {PRIORIDADE_LABEL[os.prioridade] ?? os.prioridade}
        </Selo>
      </TicketLinha>
      <TicketLinha rotulo="Status">
        <SeletorStatusOS status={status} disabled={salvando} onChange={alterarStatus} />
      </TicketLinha>
      {erro && <span className="text-danger block text-xs" role="alert">{erro}</span>}
    </Ticket>
  );
}
