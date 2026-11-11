import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = { title: "Iniciar sesión · Kinal Sports Admin" };

/** Cancha vista desde arriba: textura del panel azul */
function FieldIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <rect width="600" height="900" fill="#0b3a7d" />
      {[0, 180, 360, 540, 720].map((y) => (
        <rect key={y} y={y} width="600" height="90" fill="#0a3778" />
      ))}
      <g fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="4">
        <rect x="60" y="60" width="480" height="780" rx="6" />
        <line x1="60" y1="450" x2="540" y2="450" />
        <circle cx="300" cy="450" r="86" />
        <rect x="170" y="60" width="260" height="130" />
        <rect x="235" y="60" width="130" height="50" />
        <path d="M 245 190 A 70 70 0 0 0 355 190" />
        <rect x="170" y="710" width="260" height="130" />
        <rect x="235" y="790" width="130" height="50" />
        <path d="M 245 710 A 70 70 0 0 1 355 710" />
      </g>
      <g fill="#fff" fillOpacity="0.3">
        <circle cx="300" cy="450" r="6" />
        <circle cx="300" cy="150" r="5" />
        <circle cx="300" cy="750" r="5" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <section className="relative hidden flex-1 flex-col justify-between gap-10 overflow-hidden bg-brand p-14 text-white lg:flex">
        <FieldIllustration />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,49,109,0.55)_0%,rgba(8,49,109,0.15)_45%,rgba(8,49,109,0.85)_100%)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-[14px] bg-white p-1.5">
            <Image
              src="/kinal_sports.png"
              alt="Logo de Kinal Sports"
              width={46}
              height={46}
            />
          </span>
          <span className="font-display text-xl font-bold">Kinal Sports</span>
        </div>
        <div className="relative flex max-w-[460px] flex-col gap-4">
          <h1 className="font-display text-[44px] font-bold leading-[1.1]">
            Administra canchas, reservas y torneos en un solo lugar.
          </h1>
          <p className="text-[17px] text-[#c7d4ea]">
            Acceso exclusivo para el personal administrador.
          </p>
        </div>
        <p className="relative text-[13px] text-[#c7d4ea]">Kinal Guatemala</p>
      </section>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
