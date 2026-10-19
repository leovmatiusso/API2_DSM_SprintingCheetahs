import { useNavigate } from "react-router-dom";

import type { OrdemServicoResumo } from "@/api";

import { Selo, Ticket, TicketLinha } from "./Ticket";
import {
  PRIORIDADE_CLASSE,
  PRIORIDADE_LABEL,
  STATUS_CLASSE,
  STATUS_LABEL,
} from "./osEstilos";

// Ticket de uma O.S. - ao clicar abre a O.S. expandida
export default function OrdemTicket({ os }: { os: OrdemServicoResumo }) {
  const navigate = useNavigate();

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
        <Selo classe={STATUS_CLASSE[os.status]}>
          {STATUS_LABEL[os.status] ?? os.status}
        </Selo>
      </TicketLinha>
    </Ticket>
  );
}
