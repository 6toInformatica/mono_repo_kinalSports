import { api } from "@/shared/api/client";

export interface AuthUser {
  id: string;
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: string;
  status?: boolean;
  isEmailVerified?: boolean;
}

export const ROLES = ["ADMIN_ROLE", "USER_ROLE"] as const;
export const ROLE_LABELS: Record<(typeof ROLES)[number], string> &
  Record<string, string | undefined> = {
  ADMIN_ROLE: "Administrador",
  USER_ROLE: "Usuario",
};

export const getUsers = async () => {
  const data = await api<AuthUser[] | { users?: AuthUser[] }>(
    "auth",
    "auth/users",
  );
  return Array.isArray(data) ? data : (data.users ?? []);
};

export const updateUserRole = (id: string, roleName: string) =>
  api<AuthUser>("auth", `users/${id}/role`, {
    method: "PUT",
    body: { roleName },
  });

export const registerUser = (form: FormData) =>
  api("auth", "auth/register", { method: "POST", body: form });
