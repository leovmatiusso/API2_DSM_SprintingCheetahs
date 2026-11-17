import type { ComponentPropsWithoutRef } from "react";
import { type LucideIcon, CalendarDays } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";

const input = tv({
  slots: {
    container: "w-full",
    label: "text-text-muted mb-2 block font-semibold",
    inputWrapper: "relative",
    iconLeft: "text-text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 size-3.5 @3xl:size-4.5",
    iconRight: "text-text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 size-3.5 @3xl:size-4.5",
    element: [
      "border",
      "placeholder:text-text-muted",
      "h-9.5 @3xl:h-11 w-full",
      "transition outline-none",
      "focus:ring-primary focus:ring-2",
      "read-only:opacity-70",
      "px-3",
      "disabled:cursor-not-allowed disabled:opacity-50",
    ],
  },
  variants: {
    variant: {
      default: {
        element: "bg-bg text-text rounded-lg border-border focus:border-primary",
      },
      pill: {
        element: "bg-white text-black rounded-full border-primary border-2 hover:border-primary-hover focus:border-primary-hover",
      },
    },
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
    hasIconLeft: {
      true: {
        element: "pl-8 @3xl:pl-10",
      },
    },
    hasIconRight: {
      true: {
        element: "pr-8 @3xl:pr-10",
      },
    },
    isDateEmpty: {
      true: {
        element: "date-empty",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    textSize: "sm",
  },
});

export type InputVariants = VariantProps<typeof input>;

export interface InputProps
  extends ComponentPropsWithoutRef<"input">,
    Omit<InputVariants, "hasIconLeft" | "hasIconRight" | "isDateEmpty"> {
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
  variant = "default",
  className = "",
  textSize = "sm",
  ...props
}: InputProps) {
  const isDate = type === "date";
  const isDateEmpty = isDate && !value;

  const ResolvedIconRight = !IconRight && isDate ? CalendarDays : IconRight;

  // Gerencia as classes dos slots do tailwind-variants
  const styles = input({
    variant,
    textSize,
    hasIconLeft: !!IconLeft,
    hasIconRight: !!ResolvedIconRight,
    isDateEmpty,
  });

  return (
    <div className={styles.container()}>
      {label && (
        <label htmlFor={props.id} className={styles.label()}>
          {label}
          {required && (
            <span className="text-danger ml-0.5 font-light" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={styles.inputWrapper()}>
        {IconLeft && <IconLeft className={styles.iconLeft()} />}

        <input
          {...props}
          type={type}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={styles.element({ class: className })}
        />

        {ResolvedIconRight && (
          <ResolvedIconRight className={styles.iconRight()} />
        )}
      </div>
    </div>
  );
}