"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "./confirm";
import { ToastProvider } from "./toast";

/** Avisos y diálogo de confirmación disponibles en toda la app */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
