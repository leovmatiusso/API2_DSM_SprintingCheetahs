import { AlignLeft } from "lucide-react";

import Textarea from "@/components/ui/Textarea";

// Descrição com o botão "Usar modelo de descrição" no canto inferior direito:
// um clique já insere o modelo no texto (sem abrir opções).
export default function CampoDescricao({
  id,
  label = "Descrição",
  value,
  onChange,
  placeholder,
  modelo,
  required,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (texto: string) => void;
  placeholder?: string;
  modelo: string;
  required?: boolean;
}) {
  function usarModelo() {
    onChange(value.trim() ? `${value.trimEnd()}\n\n${modelo}` : modelo);
  }

  return (
    <div className="relative">
      <Textarea
        id={id}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={5000}
        placeholder={placeholder}
        required={required}
        className="min-h-36 pb-11"
      />

      <button
        type="button"
        onClick={usarModelo}
        className="border-primary bg-primary-muted text-primary absolute right-3 bottom-3 flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
      >
        <AlignLeft size={13} />
        Usar modelo de descrição
      </button>
    </div>
  );
}
