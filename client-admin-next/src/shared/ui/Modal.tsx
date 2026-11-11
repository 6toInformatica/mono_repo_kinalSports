"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Botones del pie del modal */
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Diálogo modal sobre <dialog>: el navegador gestiona el foco, Esc lo cierra y el
 * resto de la página queda inerte mientras está abierto.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "lg",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${size === "lg" ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-ink/50`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-start gap-4 border-b border-line px-6 py-5">
            <div className="flex flex-col gap-1">
              <h2
                id={titleId}
                className="font-display text-xl font-bold text-brand"
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm text-ink-soft">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-surface"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <footer className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
