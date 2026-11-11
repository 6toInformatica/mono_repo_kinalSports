import "server-only";
import { cookies } from "next/headers";
import { COOKIE, parseSessionUser } from "./session";

/** Usuario de la sesión, para los componentes de servidor */
export const getCurrentUser = async () =>
  parseSessionUser((await cookies()).get(COOKIE.user)?.value);
