import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { SessionWatcher } from "@/features/auth/SessionWatcher";
import { getCurrentUser } from "@/server/current-user";

const SECTIONS = [
  { href: "/dashboard/fields", label: "Canchas" },
  { href: "/dashboard/reservations", label: "Reservas" },
  { href: "/dashboard/teams", label: "Equipos" },
  { href: "/dashboard/tournaments", label: "Torneos" },
  { href: "/dashboard/users", label: "Usuarios" },
];

// proxy.ts ya garantizó que hay una sesión de administrador
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SessionWatcher />
      <header className="flex items-center justify-between bg-main-blue px-6 py-3 text-white">
        <span className="text-lg font-bold">Kinal Sports Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.username}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="flex">
        <nav className="min-h-[calc(100vh-3.25rem)] w-56 bg-white p-4 shadow-sm">
          <ul className="flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-lg px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
