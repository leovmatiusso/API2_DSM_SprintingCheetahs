import { LucideIcon } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "hover:bg-bg-tertiary flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm cursor-pointer",
  variants: {
    variant: {
      primary: "text-text",
      danger: "text-danger",
    }
  },
  defaultVariants: {
    variant: "primary"
  },
});

export type ButtonVariants = VariantProps<typeof button>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  text: string;
  icon: LucideIcon;
}

export default function EditButton({
  className,
  text,
  icon: Icon,
  variant,
  ...props
}: ButtonProps) {
  return (
    <button className={button({ variant, className })} {...props}>
      <Icon size={16} />
      {text}
    </button>
  );
}
