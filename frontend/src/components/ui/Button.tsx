interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

const variantStyles = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-secondary text-text hover:bg-secondary-hover",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg
        px-4 py-2
        text-sm font-medium
        transition
        cursor-pointer
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantStyles[variant]}
      `}
    >
      {children}
    </button>
  );
}