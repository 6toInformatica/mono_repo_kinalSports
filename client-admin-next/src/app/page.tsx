import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/kinal_sports.png"
            alt="Kinal Sports"
            width={64}
            height={64}
          />
          <h1 className="text-xl font-bold text-main-blue">
            Kinal Sports Admin
          </h1>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
