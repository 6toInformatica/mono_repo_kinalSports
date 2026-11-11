"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type SVGProps } from "react";
import { logout, type SessionUser } from "@/features/auth/session";
import { Avatar } from "@/shared/ui/table";
import {
  CalendarIcon,
  FieldIcon,
  LogoutIcon,
  OverviewIcon,
  TeamIcon,
  TrophyIcon,
  UserIcon,
} from "@/shared/ui/icons";

const SECTIONS: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { href: "/dashboard", label: "Vista general", icon: OverviewIcon },
  { href: "/dashboard/reservations", label: "Reservas", icon: CalendarIcon },
  { href: "/dashboard/fields", label: "Canchas", icon: FieldIcon },
  { href: "/dashboard/teams", label: "Equipos", icon: TeamIcon },
  { href: "/dashboard/tournaments", label: "Torneos", icon: TrophyIcon },
  { href: "/dashboard/users", label: "Usuarios", icon: UserIcon },
];

const isActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === href : pathname.startsWith(href);

function useLogout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    await logout().catch(() => undefined);
    router.replace("/");
    router.refresh();
  };
  return { loading, run };
}

export function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const { loading, run } = useLogout();
  const name = user
    ? [user.name, user.surname].filter(Boolean).join(" ") || user.username
    : "";

  return (
    <>
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-brand text-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <Image
            src="/kinal_sports.png"
            alt=""
            width={40}
            height={40}
            className="rounded-lg bg-white p-1"
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">Kinal Sports</p>
            <p className="text-xs text-white/70">Panel de administración</p>
          </div>
        </div>
        <nav aria-label="Secciones" className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {SECTIONS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition ${
                      active
                        ? "bg-white text-brand"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <Avatar src={user?.profilePicture} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-white/70">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex size-11 items-center justify-center rounded-[10px] text-white/85 hover:bg-white/10 disabled:opacity-50"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Móvil: barra superior y navegación inferior */}
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-brand px-4 py-3 text-white lg:hidden">
        <Image
          src="/kinal_sports.png"
          alt=""
          width={32}
          height={32}
          className="rounded-md bg-white p-0.5"
        />
        <p className="font-display font-bold">Kinal Sports</p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          aria-label="Cerrar sesión"
          className="ml-auto flex size-11 items-center justify-center rounded-[10px] hover:bg-white/10"
        >
          <LogoutIcon />
        </button>
      </header>
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-6">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                    active ? "text-brand" : "text-ink-soft"
                  }`}
                >
                  <Icon />
                  <span className="max-w-full truncate px-0.5">
                    {label.replace("Vista general", "Inicio")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
