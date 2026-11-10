import { Suspense } from "react";
import { VerifyEmail } from "@/features/auth/VerifyEmail";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-xl font-bold text-main-blue">
          Verificación de correo
        </h1>
        <Suspense>
          <VerifyEmail />
        </Suspense>
      </div>
    </main>
  );
}
