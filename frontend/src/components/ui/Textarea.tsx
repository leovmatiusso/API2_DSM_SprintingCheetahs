import type { ComponentPropsWithoutRef } from "react";

interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  label?: string;
}

export default function Textarea({
  label,
  required,
  disabled,
  readOnly,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={props.id}
          className="text-text-muted mb-2 block text-sm font-semibold"
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

      <textarea
        {...props}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        className={`
          bg-bg text-text
          min-h-33 w-full resize-y
          rounded-lg border border-border
          p-3.5 text-sm leading-6
          outline-none transition
          placeholder:text-text-muted
          focus:border-primary
          focus:ring-2 focus:ring-primary
          read-only:opacity-70
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${className}
        `}
      />
    </div>
  );
}