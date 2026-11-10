"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "./session";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    await logout().catch(() => undefined);
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-lg border border-white/40 px-3 py-1 text-sm font-semibold text-white hover:bg-white/10"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
