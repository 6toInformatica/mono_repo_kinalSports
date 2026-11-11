"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/shared/api/client";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/fields";
import { login } from "./session";

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-[10px] px-3.5 py-3 text-sm ${
        tone === "error"
          ? "bg-red-100 text-red-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="mt-px shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

const CARD =
  "flex w-full max-w-[400px] flex-col gap-[18px] rounded-[18px] border border-line bg-white p-9";
const LINK =
  "self-center text-sm font-semibold text-brand hover:text-brand-dark";

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(
      new FormData(event.currentTarget).get("email") ?? "",
    ).trim();
    if (!email) {
      setMessage({ tone: "error", text: "Ingresa tu correo." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api("auth", "auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setMessage({
        tone: "success",
        text: "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.",
      });
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className={CARD}>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[26px] font-bold text-brand">
          Recuperar contraseña
        </h2>
        <p className="text-sm text-ink-soft">
          Te enviaremos un enlace a tu correo.
        </p>
      </div>
      <TextField
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Button type="submit" loading={loading} className="min-h-12">
        Enviar enlace
      </Button>
      <button type="button" onClick={onBack} className={LINK}>
        Volver a iniciar sesión
      </button>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const expired = useSearchParams().get("expired") === "1";
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [error, setError] = useState<string | null>(
    expired ? "Tu sesión expiró. Inicia sesión de nuevo." : null,
  );
  const [loading, setLoading] = useState(false);

  if (mode === "forgot")
    return <ForgotPassword onBack={() => setMode("login")} />;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(null);
    try {
      await login(
        String(form.get("emailOrUsername") ?? ""),
        String(form.get("password") ?? ""),
      );
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={CARD}>
      <Image
        src="/kinal_sports.png"
        alt="Logo de Kinal Sports"
        width={72}
        height={72}
        className="self-center"
        priority
      />
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[26px] font-bold text-brand">
          Iniciar sesión
        </h2>
        <p className="text-sm text-ink-soft">
          Usa tu correo o tu nombre de usuario.
        </p>
      </div>
      <TextField
        label="Correo o usuario"
        name="emailOrUsername"
        required
        autoComplete="username"
      />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading} className="min-h-12">
        Iniciar sesión
      </Button>
      <button type="button" onClick={() => setMode("forgot")} className={LINK}>
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}
