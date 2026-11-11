import { api } from "@/shared/api/client";
import { fetchAllPages } from "@/shared/api/collections";

export interface Team {
  _id: string;
  teamName: string;
  managerId: string;
  category: string;
  logo?: string;
  members?: unknown[];
  namedMembers?: { _id?: string; name: string }[];
}

export const getTeams = () => fetchAllPages<Team>("teams");

export const saveTeam = (form: FormData, id?: string) =>
  api<{ data: Team }>("admin", id ? `teams/${id}` : "teams", {
    method: id ? "PUT" : "POST",
    body: form,
  });

export const deactivateTeam = (id: string) =>
  api("admin", `teams/${id}/deactivate`, { method: "PUT" });
