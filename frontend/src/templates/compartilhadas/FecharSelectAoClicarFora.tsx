import { useEffect, type RefObject } from "react";

export default function FecharSelectAoClicarFora(
  ref: RefObject<HTMLElement | null>,
  ativo: boolean,
  aoFechar: () => void,
) {
  useEffect(() => {
    if (!ativo) return;
    const fechar = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) aoFechar();
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [ref, ativo, aoFechar]);
}
