import { useState } from "react";

import type { ComponentPropsWithoutRef } from "react";

import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "onChange"> {
  label?: string;
  variant?: "default" | "pill";
  onChange?: (value: string) => void;
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

export default function PasswordInput({
  label,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  variant = "default",
  className = "",
  textSize = "sm",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

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
        <input
          {...props}
          type={visible ? "text" : "password"}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className={`
            placeholder:text-text-muted
            h-11 w-full border
            px-3 pr-10 transition outline-none
            focus:ring-2
            focus:ring-primary
            read-only:opacity-70
            disabled:cursor-not-allowed
            disabled:opacity-50
            text-${textSize}
            ${variantStyles[variant]}
            ${className}
          `}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          className={`
            text-text-muted
            absolute top-1/2 right-3
            -translate-y-1/2
            cursor-pointer
            text-${textSize}
            disabled:cursor-not-allowed
          `}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </div>
  );
}