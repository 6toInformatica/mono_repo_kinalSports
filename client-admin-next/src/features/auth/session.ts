import { api, request } from "@/shared/api/client";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
  phone?: string;
  profilePicture?: string;
  role: string;
}

export const login = (emailOrUsername: string, password: string) =>
  request<{ user: SessionUser }>("/api/session", {
    method: "POST",
    body: { emailOrUsername, password },
  });

export const logout = () =>
  request<{ message: string }>("/api/session", { method: "DELETE" });

export const fetchSessionUser = () =>
  request<{ user: SessionUser | null }>("/api/session");

export const updateSessionUser = (patch: Partial<SessionUser>) =>
  request<{ user: SessionUser }>("/api/session", {
    method: "PATCH",
    body: patch,
  });

export const fetchMyProfile = async () => {
  const res = await api<{ data?: SessionUser } | SessionUser>(
    "auth",
    "auth/profile",
  );
  return (res && "data" in res && res.data ? res.data : res) as SessionUser;
};

export const updateMyProfilePicture = async (file: File) => {
  const form = new FormData();
  form.append("profilePicture", file);
  const res = await api<{ data?: SessionUser } | SessionUser>(
    "auth",
    "auth/profile/picture",
    { method: "POST", body: form },
  );
  return (res && "data" in res && res.data ? res.data : res) as SessionUser;
};
