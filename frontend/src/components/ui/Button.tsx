interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
}

const variantStyles = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-secondary text-text hover:bg-secondary-hover",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

const sizeStyles = {
  sm: "px-2 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
  xl: "px-8 py-3 text-base",
};

export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  size = "md",
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg
        font-medium
        transition
        cursor-pointer
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${sizeStyles[size]}
        ${variantStyles[variant]}
      `}
    >
      {children}
    </button>
  );
}