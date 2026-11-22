
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  size?: number;
  className?: string;
}

export default function Checkbox({
  checked,
  size = 13,
  className = "",
}: CheckboxProps) {
  return (
    <span
      aria-hidden="true"
      className={`
        flex shrink-0 items-center justify-center
        rounded border
        ${
          checked
            ? "border-primary bg-primary text-white"
            : "border-border bg-bg size-4"
        }
        ${className}
      `}
    >
      {checked && <Check size={size} />}
    </span>
  );
}
