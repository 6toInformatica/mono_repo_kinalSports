import type { ReactNode } from "react";
import { SessionWatcher } from "@/features/auth/SessionWatcher";
import { Sidebar } from "@/features/layout/Sidebar";
import { getCurrentUser } from "@/server/current-user";

// proxy.ts ya garantizó que hay una sesión de administrador
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <SessionWatcher />
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
