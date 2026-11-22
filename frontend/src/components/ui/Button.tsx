import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "cursor-pointer rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-primary text-white hover:bg-primary-hover",
      outline: "text-primary ring ring-border hover:bg-primary-muted",
      secondary: "bg-secondary text-text hover:bg-secondary-hover",
      danger: "bg-danger text-white hover:bg-danger-hover",
    },
    size: {
      sm: "px-2 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-base",
      xl: "px-8 py-3 text-base",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonVariants = VariantProps<typeof button>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  children: React.ReactNode;
}

export default function Button({
  children,
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button className={button({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
