import { useState } from "react";
import { X } from "lucide-react";

import Input from "@/components/ui/Input";

export interface EquipamentoForm {
  nome: string;
  quantidade: number;
}

const EQUIPAMENTOS_DISPONIVEIS = [
  "Aerostato",
  "Torre",
  "Câmera óptica",
  "Câmera térmica",
  "Switch",
  "Roteador",
  "Cabo de rede",
  "Conector RJ45",
  "Patch Cord",
  "Sensor de movimento",
];

// Converte para o formato esperado pelo backend
export function equipamentosParaPayload(equipamentos: EquipamentoForm[]) {
  return equipamentos.map(({ nome, quantidade }) => ({
    nome_equipamento: nome,
    quantidade,
  }));
}

// Busca de equipamentos e materiais + lista (chips) dos itens escolhidos.
// Escolher o mesmo item de novo aumenta a quantidade.
export default function CampoEquipamentos({
  value,
  onChange,
}: {
  value: EquipamentoForm[];
  onChange: (equipamentos: EquipamentoForm[]) => void;
}) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const filtrados = EQUIPAMENTOS_DISPONIVEIS.filter((nome) =>
    nome.toLowerCase().includes(busca.toLowerCase()),
  );

  function adicionar(nome: string) {
    const existente = value.find((item) => item.nome === nome);

    onChange(
      existente
        ? value.map((item) =>
            item.nome === nome ? { ...item, quantidade: item.quantidade + 1 } : item,
          )
        : [...value, { nome, quantidade: 1 }],
    );
    setBusca("");
    setAberto(false);
  }

  return (
    <div>
      <div className="relative">
        <Input
          id="equipamentos"
          label="Equipamentos e materiais (opcional)"
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar equipamentos e materiais"
          autoComplete="off"
        />

        {aberto && (
          <div className="border-border bg-bg absolute right-0 left-0 z-20 mt-1.5 max-h-56 overflow-y-auto rounded-lg border p-1.5 shadow-lg">
            {filtrados.length === 0 ? (
              <p className="text-text-muted px-2 py-1.5 text-sm">
                Nenhum equipamento encontrado.
              </p>
            ) : (
              filtrados.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  onClick={() => adicionar(nome)}
                  className="hover:bg-bg-tertiary text-text flex w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm"
                >
                  {nome}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item.nome}
              className="bg-primary/15 text-primary flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            >
              {item.quantidade}x {item.nome}
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => onChange(value.filter((outro) => outro.nome !== item.nome))}
                aria-label={`Remover ${item.nome}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
