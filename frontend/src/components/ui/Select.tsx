import type { ComponentPropsWithoutRef } from "react";

interface SelectProps extends ComponentPropsWithoutRef<"select"> {
  label?: string;
  textSize?: "xs" | "sm" | "base" | "lg" | "xl";
}

export default function Select({
  label,
  required,
  disabled,
  value,
  className = "",
  children,
  textSize = "sm",
  ...props
}: SelectProps) {
  const isEmpty = value === "";

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

      <select
        {...props}
        value={value}
        required={required}
        disabled={disabled}
        className={`
          bg-bg
          h-11 w-full rounded-lg
          border border-border
          px-3 text-${textSize}
          outline-none transition
          focus:border-primary
          focus:ring-2 focus:ring-primary
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${isEmpty ? "select-empty" : "text-text"}
          ${className}
        `}
      >
        {children}
      </select>
    </div>
  );
}