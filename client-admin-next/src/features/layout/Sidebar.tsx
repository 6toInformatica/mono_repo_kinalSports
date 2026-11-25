"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  fetchMyProfile,
  logout,
  updateMyProfilePicture,
  updateSessionUser,
  type SessionUser,
} from "@/features/auth/session";
import { ROLE_LABELS } from "@/features/users/api";
import { fullName } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/feedback";
import { Modal } from "@/shared/ui/Modal";
import { Avatar } from "@/shared/ui/table";
import { useToast } from "@/shared/ui/toast";
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

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

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

function ProfileModal({
  user,
  onClose,
  onUserUpdated,
}: {
  user: SessionUser;
  onClose: () => void;
  onUserUpdated: (updated: SessionUser) => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<SessionUser>(user);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMyProfile()
      .then((fresh) => {
        if (active && fresh) {
          setProfile((prev) => ({ ...prev, ...fresh }));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const displayName = fullName(profile) || profile.username || "Administrador";
  const rows: [string, string | undefined][] = [
    ["Nombre completo", displayName],
    ["Usuario", profile.username ? `@${profile.username}` : undefined],
    ["Correo", profile.email],
    ["Teléfono", profile.phone],
  ];

  const handleSave = async () => {
    if (!selectedFile) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMyProfilePicture(selectedFile);
      const nextUser: SessionUser = {
        ...profile,
        ...updated,
      };
      await updateSessionUser(nextUser).catch(() => undefined);
      onUserUpdated(nextUser);
      toast.success("Foto de perfil actualizada");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(
        (err as Error).message || "No se pudo actualizar la foto de perfil",
      );
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title="Mi perfil"
      description="Información de tu cuenta de administrador"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {selectedFile && (
            <Button onClick={() => void handleSave()} loading={saving}>
              Guardar foto
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar src={preview ?? profile.profilePicture} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-base font-bold text-ink">
                {displayName}
              </p>
              <Badge tone="info">
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-ink-soft">
              @{profile.username}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file || !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
                  setSelectedFile(null);
                  setPreview(null);
                  return;
                }
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    setPreview(reader.result);
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs font-semibold text-brand hover:underline"
            >
              {selectedFile ? "Elegir otra imagen" : "Cambiar foto de perfil"}
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-ink-soft">{label}</dt>
              <dd className="break-all font-medium text-ink">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}

export function Sidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const { loading, run } = useLogout();
  const [overrideUser, setOverrideUser] = useState<SessionUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentUser = overrideUser ?? user;

  useEffect(() => {
    if (user) return;
    let active = true;
    fetchMyProfile()
      .then((fresh) => {
        if (active && fresh) {
          setOverrideUser(fresh);
          void updateSessionUser(fresh).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const name = currentUser
    ? [currentUser.name, currentUser.surname].filter(Boolean).join(" ") ||
      currentUser.username ||
      "Administrador"
    : "Administrador";
  const username = currentUser?.username || "admin";

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
        <div className="m-3 flex items-center gap-2 rounded-xl bg-white/10 p-2">
          <button
            type="button"
            onClick={() => currentUser && setProfileOpen(true)}
            aria-label="Ver mi perfil"
            title="Ver mi perfil"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-white/10"
          >
            <Avatar src={currentUser?.profilePicture} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-white/70">@{username}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-white/85 hover:bg-white/10 disabled:opacity-50"
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
          onClick={() => currentUser && setProfileOpen(true)}
          aria-label="Ver mi perfil"
          className="ml-auto flex items-center gap-2 rounded-lg p-1 hover:bg-white/10"
        >
          <Avatar src={currentUser?.profilePicture} size={32} />
        </button>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          aria-label="Cerrar sesión"
          className="flex size-11 items-center justify-center rounded-[10px] hover:bg-white/10"
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

      {profileOpen && currentUser && (
        <ProfileModal
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onUserUpdated={setOverrideUser}
        />
      )}
    </>
  );
}
