"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/shared/api/client";

export function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setMessage({ ok: false, text: "Las contraseñas no coinciden." });
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ message: string }>(
        "auth",
        "auth/reset-password",
        { method: "POST", body: { token, newPassword } },
      );
      setMessage({ ok: true, text: data.message });
    } catch (error) {
      setMessage({ ok: false, text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (message?.ok) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-gray-700">{message.text}</p>
        <Link href="/" className="font-semibold text-brand underline">
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nueva contraseña
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Confirmar contraseña
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
      </label>
      {message && <p className="text-sm text-red-600">{message.text}</p>}
      <button
        type="submit"
        disabled={loading || !token}
        className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Restablecer contraseña"}
      </button>
    </form>
  );
}
