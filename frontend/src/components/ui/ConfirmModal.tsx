
import type { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="bg-bg border-border w-full max-w-sm rounded-2xl border p-6 shadow-lg"
      >
        <h2
          id="confirm-modal-title"
          className="text-text mb-2 text-xl font-bold"
        >
          {title}
        </h2>

        <p className="text-text-muted mb-6">
          {description}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-bg-secondary"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
