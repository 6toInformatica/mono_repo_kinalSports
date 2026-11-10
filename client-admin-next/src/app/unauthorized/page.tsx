import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-main-blue">
        Acceso no autorizado
      </h1>
      <p>No tienes permisos para acceder como administrador.</p>
      <Link href="/" className="font-semibold text-main-blue underline">
        Volver al inicio
      </Link>
    </main>
  );
}
