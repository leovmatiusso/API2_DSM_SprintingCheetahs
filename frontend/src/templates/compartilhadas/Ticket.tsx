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
    <button
      type="button"
      onClick={onClick}
      className="nova-os-card border-border cursor-pointer rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <h3 className="text-text border-border m-0 mb-2 border-b pb-2 text-xl leading-tight font-bold break-words">
        {titulo}
      </h3>
      {children}
    </button>
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
    <p className="text-text m-0 mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
      <span className="font-semibold">{rotulo}:</span>
      {children}
    </p>
  );
}

export function Selo({ classe, children }: { classe: string; children: ReactNode }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${classe}`}>
      {children}
    </span>
  );
}
