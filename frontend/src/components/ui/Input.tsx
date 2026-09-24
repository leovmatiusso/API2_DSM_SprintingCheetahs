import type { ComponentPropsWithoutRef } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays } from "lucide-react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
}

export default function Input({
  label,
  iconLeft: IconLeft,
  iconRight: IconRight,
  required,
  disabled,
  readOnly,
  type = "text",
  value,
  className = "",
  ...props
}: InputProps) {
  const isDate = type === "date";
  const isDateEmpty = isDate && !value;

  IconRight = !IconRight && isDate ? CalendarDays : IconRight;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="text-text-muted mb-2 block text-sm font-semibold">
          {label}

          {required && (
            <span className="text-danger ml-0.5 font-light" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {IconLeft && (
          <IconLeft
            size={18}
            className="text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
        )}

        <input
          {...props}
          type={type}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`bg-bg text-text border-border placeholder:text-text-muted h-11 w-full rounded-lg border px-3 text-sm transition outline-none ${isDateEmpty ? "date-empty" : ""} focus:border-primary focus:ring-primary read-only:opacity-70 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${IconLeft ? "pl-10" : ""} ${IconRight ? "pr-10" : ""} ${className} `}
        />

        {IconRight && (
          <IconRight
            size={18}
            className="text-text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          />
        )}
      </div>
    </div>
  );
}
