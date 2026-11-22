import type { ComponentPropsWithoutRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const select = tv({
  slots: {
    container: "w-full",
    label: "text-text-muted mb-2 block font-semibold",
    element: [
      "bg-bg",
      "h-9.5 @3xl:h-11 w-full rounded-lg",
      "border border-border",
      "px-3",
      "outline-none transition",
      "focus:border-primary",
      "focus:ring-2 focus:ring-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ],
  },
  variants: {
    textSize: {
      xs: {
        label: "text-xs",
        element: "text-xs",
      },
      sm: {
        label: "text-sm",
        element: "text-sm",
      },
      base: {
        label: "text-base",
        element: "text-base",
      },
      lg: {
        label: "text-lg",
        element: "text-lg",
      },
      xl: {
        label: "text-xl",
        element: "text-xl",
      },
    },
    isEmpty: {
      true: {
        element: "select-empty",
      },
      false: {
        element: "text-text",
      },
    },
  },
  defaultVariants: {
    textSize: "sm",
  },
});

export type SelectVariants = VariantProps<typeof select>;

export interface SelectProps
  extends ComponentPropsWithoutRef<"select">,
    Omit<SelectVariants, "isEmpty"> {
  label?: string;
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

  const styles = select({
    textSize,
    isEmpty,
  });

  return (
    <div className={styles.container()}>
      {label && (
        <label htmlFor={props.id} className={styles.label()}>
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
        className={styles.element({ class: className })}
      >
        {children}
      </select>
    </div>
  );
}