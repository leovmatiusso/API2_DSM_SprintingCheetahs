import { useState } from "react";

import Button from "@/components/ui/Button";

interface Props {
  onGerar: () => Promise<void>;
  desabilitado?: boolean;
  /** Texto exibido ao passar o mouse quando o botão está desabilitado */
  dica?: string;
}

export default function BotaoRelatorio({ onGerar, desabilitado = false, dica }: Props) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setErro(null);
    setGerando(true);
    try {
      await onGerar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar o relatório.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="relative" title={desabilitado ? dica : undefined}>
      <Button variant="primary" onClick={handleClick} disabled={desabilitado || gerando}>
        {gerando ? "Gerando..." : "Gerar relatório"}
      </Button>

      {erro && (
        <p
          className="text-danger absolute right-0 top-full z-10 mt-1 w-72 text-right text-xs"
          role="alert"
        >
          {erro}
        </p>
      )}
    </div>
  );
}