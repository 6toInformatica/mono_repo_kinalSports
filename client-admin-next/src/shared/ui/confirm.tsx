"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Acción destructiva: el botón de confirmar va en rojo */
  danger?: boolean;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

/** Diálogo de confirmación: `await confirm({...})` devuelve true o false */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(pending)}
        title={pending?.title ?? ""}
        onClose={() => close(false)}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button
              variant={pending?.danger ? "danger" : "primary"}
              onClick={() => close(true)}
            >
              {pending?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{pending?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm requiere ConfirmProvider");
  return confirm;
};
