import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import FecharSelectAoClicarFora from "./FecharSelectAoClicarFora";

export default function SelectFiltro({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  FecharSelectAoClicarFora(ref, open, () => setOpen(false));
  const selected = options.find((option) => option.value === value);
  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="bg-bg border-border hover:border-border-hover flex h-9 w-full cursor-pointer items-center justify-start rounded-lg border px-2 text-sm outline-none"
      >
        <span className={selected ? "text-text" : "text-text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={18} className="text-text-muted" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={placeholder}
          className="bg-bg border-border absolute right-0 left-0 z-40 mt-1.5 max-h-60 overflow-y-auto rounded-lg border p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="text-text-muted hover:bg-bg-tertiary flex w-full cursor-pointer rounded-md p-1.5 text-sm"
          >
            Todos
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="text-text hover:bg-bg-tertiary flex w-full cursor-pointer items-center justify-between rounded-md p-1.5 text-sm"
            >
              {option.label}
              {option.value === value && <Check size={15} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
