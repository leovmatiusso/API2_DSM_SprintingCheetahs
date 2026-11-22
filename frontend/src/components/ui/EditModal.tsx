
import type { ReactNode } from "react";
import Card from "./Card";

interface EditModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function EditModal({
  isOpen,
  title,
  children,
  className = "",
}: EditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <Card className={`w-full max-w-2xl ${className}`}>
        <h2 className="text-text mb-5 text-xl font-bold">
          {title}
        </h2>

        {children}
      </Card>
    </div>
  );
}
