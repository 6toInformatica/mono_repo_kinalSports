"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SESSION_EXPIRED_EVENT } from "@/shared/api/client";

/** Si una llamada informa que la sesión ya no se puede renovar, vuelve al login */
export function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    const onExpired = () => {
      router.replace("/?expired=1");
      router.refresh();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router]);

  return null;
}
