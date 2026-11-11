import { api } from "@/shared/api/client";
import { fetchList } from "@/shared/api/collections";

export interface Tournament {
  _id: string;
  tournamentsName: string;
  category: string;
  startDate: string;
  endDate: string;
  description: string;
  logo?: string;
  status?: string;
  teams?: unknown[];
}

export const getTournaments = () => fetchList<Tournament>("tournaments");

export const saveTournament = (form: FormData, id?: string) =>
  api<{ data: Tournament }>("admin", id ? `tournaments/${id}` : "tournaments", {
    method: id ? "PUT" : "POST",
    body: form,
  });

export const deactivateTournament = (id: string) =>
  api("admin", `tournaments/${id}/deactivate`, { method: "PUT" });
