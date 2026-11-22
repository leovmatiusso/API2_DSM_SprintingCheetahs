import { useState, useMemo, useCallback } from "react";

interface Selectable {
  id: string;
}

export default function useSelecao<T extends Selectable>(items: T[]) {
  const [selectedIds, setSelected] = useState<string[]>([]);

  // Seleção individual
  const toggleSelected = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }, []);

  // Selecionar/desmarcar todos os itens visíveis
  const toggleAllVisible = useCallback(() => {
    const visibleIds = items.map((item) => item.id);

    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelected((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  }, [items, selectedIds]);

  // Verifica se todos os itens visíveis estão selecionados
  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  // Remove seleções de itens que não existem mais na lista
  const prune = useCallback((validIds: string[]) => {
    const valid = new Set(validIds);
    setSelected((current) => current.filter((id) => valid.has(id)));
  }, []);

  return {
    selectedIds,
    toggleSelected,
    toggleAllVisible,
    allSelected,
    prune,
  };
}
