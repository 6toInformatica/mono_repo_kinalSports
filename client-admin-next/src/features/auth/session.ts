import { request } from "@/shared/api/client";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
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
