import { useEffect, type RefObject } from "react";

// Fecha um dropdown quando o usuário clica fora do elemento referenciado.
export default function FecharSelectAoClicarFora(
  ref: RefObject<HTMLElement | null>,
  ativo: boolean,
  aoFechar: () => void,
) {
  useEffect(() => {
    if (!ativo) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) aoFechar();
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, ativo, aoFechar]);
}