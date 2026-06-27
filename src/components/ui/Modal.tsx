import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
