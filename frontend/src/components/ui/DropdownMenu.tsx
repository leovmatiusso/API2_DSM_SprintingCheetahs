
import type { ReactNode } from "react";

interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
  position?: "left" | "right";
}

export default function DropdownMenu({
  children,
  className = "",
  position = "right",
}: DropdownMenuProps) {
  return (
    <div
      className={`
        bg-bg border-border absolute top-full z-20 mt-1
        min-w-36 rounded-lg border p-1 shadow-lg
        ${position === "right" ? "right-0" : "left-0"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
