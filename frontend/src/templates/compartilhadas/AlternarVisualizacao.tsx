import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

export type ModoVisualizacao = "tickets" | "lista";

// Guarda o modo escolhido por tela (ex.: "projetos", "manutencoes") no navegador.
export function useModoVisualizacao(tela: string) {
  const chave = `visualizacao-${tela}`;

  const [modo, setModo] = useState<ModoVisualizacao>(() => {
    try {
      return localStorage.getItem(chave) === "lista" ? "lista" : "tickets";
    } catch {
      return "tickets";
    }
  });

  function alterarModo(novoModo: ModoVisualizacao) {
    setModo(novoModo);
    try {
      localStorage.setItem(chave, novoModo);
    } catch {
      // Sem armazenamento disponível: o modo vale só enquanto a tela estiver aberta.
    }
  }

  return [modo, alterarModo] as const;
}

const OPCOES: { valor: ModoVisualizacao; rotulo: string; Icone: typeof List }[] = [
  { valor: "lista", rotulo: "Visualizar em lista", Icone: List },
  { valor: "tickets", rotulo: "Visualizar em tickets", Icone: LayoutGrid },
];

// Botão que alterna a visualização entre lista e tickets.
export default function AlternarVisualizacao({
  modo,
  onChange,
}: {
  modo: ModoVisualizacao;
  onChange: (modo: ModoVisualizacao) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Formato de visualização"
      className="border-border bg-bg inline-flex shrink-0 rounded-lg border p-0.5"
    >
      {OPCOES.map(({ valor, rotulo, Icone }) => {
        const ativo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            title={rotulo}
            aria-label={rotulo}
            aria-pressed={ativo}
            onClick={() => onChange(valor)}
            className={`flex h-8 w-9 cursor-pointer items-center justify-center rounded-md transition ${
              ativo ? "bg-primary-muted text-primary" : "text-text-muted hover:text-text"
            }`}
          >
            <Icone size={17} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
