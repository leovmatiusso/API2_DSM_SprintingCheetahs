import type { ComponentPropsWithoutRef } from "react";

import type { LucideIcon } from "lucide-react";

import { CalendarDays } from "lucide-react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  variant?: "default" | "pill";
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
}

const variantStyles = {
  default: `
    bg-bg
    text-text
    rounded-lg
    border-border
    focus:border-primary
  `,

  pill: `
    bg-white
    text-black
    rounded-full
    border-primary
    border-2
    hover:border-primary-hover
    focus:border-primary-hover
  `,
};

export default function Input({
  label,
  iconLeft: IconLeft,
  iconRight: IconRight,
  required,
  disabled,
  readOnly,
  type = "text",
  value,
  variant = "default",
  className = "",
  textSize = "sm",
  ...props
}: InputProps) {
  const isDate = type === "date";
  const isDateEmpty = isDate && !value;

  IconRight = !IconRight && isDate ? CalendarDays : IconRight;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={props.id}
          className={`text-text-muted mb-2 block text-${textSize} font-semibold`}
        >
          {label}

          {required && (
            <span
              className="text-danger ml-0.5 font-light"
              aria-hidden="true"
            >
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
          className={`
            border
            placeholder:text-text-muted
            h-11 w-full
            px-3 text-${textSize}
            transition outline-none
            ${isDateEmpty ? "date-empty" : ""}
            ${variantStyles[variant]}
            focus:ring-primary
            focus:ring-2
            read-only:opacity-70
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${IconLeft ? "pl-10" : ""}
            ${IconRight ? "pr-10" : ""}
            ${className}
          `}
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