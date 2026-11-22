import type { ReactNode } from "react";

// Ticket (cartão clicável) usado nas listagens de projetos, manutenções e O.S.
export function Ticket({
  titulo,
  onClick,
  children,
}: {
  titulo: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${titulo}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="nova-os-card border-border cursor-pointer rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-text border-border m-0 mb-2 border-b pb-2 text-xl leading-tight font-bold break-words">
        {titulo}
      </h3>
      {children}
    </div>
  );
}

// Linha clicável usada na visualização em lista de projetos e manutenções:
// nome | responsável | prioridade | status.
export function ItemLista({
  titulo,
  responsavel,
  prioridade,
  status,
  onClick,
}: {
  titulo: string;
  responsavel: string;
  prioridade: ReactNode;
  status: ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir ${titulo}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="nova-os-card border-border grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-left text-sm shadow-sm transition hover:shadow-md lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_7rem_9rem]"
    >
      <span className="text-text truncate font-medium" title={titulo}>
        {titulo}
      </span>
      <span className="text-text truncate" title={responsavel}>
        {responsavel}
      </span>
      <span className="flex lg:justify-center">{prioridade}</span>
      <span className="flex lg:justify-center">{status}</span>
    </div>
  );
}

export function TicketLinha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="text-text m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold">{rotulo}:</span>
      {children}
    </div>
  );
}

export function Selo({ classe, children }: { classe: string; children: ReactNode }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${classe}`}>
      {children}
    </span>
  );
}
