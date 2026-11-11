"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/shared/api/client";

type State = { status: "loading" | "success" | "error"; message: string };

export function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>(
    token
      ? { status: "loading", message: "Verificando tu correo..." }
      : {
          status: "error",
          message: "El enlace no tiene token de verificación.",
        },
  );

  useEffect(() => {
    if (!token) return;
    api<{ message: string }>("auth", "auth/verify-email", {
      method: "POST",
      body: { token },
    })
      .then((data) => setState({ status: "success", message: data.message }))
      .catch((error: Error) =>
        setState({ status: "error", message: error.message }),
      );
  }, [token]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p
        className={state.status === "error" ? "text-red-600" : "text-gray-700"}
      >
        {state.message}
      </p>
      {state.status !== "loading" && (
        <Link href="/" className="font-semibold text-brand underline">
          Ir al inicio de sesión
        </Link>
      )}
    </div>
  );
}
