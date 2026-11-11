import { api } from "@/shared/api/client";
import { fetchAllPages } from "@/shared/api/collections";
import type { BadgeTone } from "@/shared/ui/feedback";

export type ReservationStatus =
  "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export interface Reservation {
  _id: string;
  fieldId?: { _id?: string; fieldName?: string } | string | null;
  user?: {
    name?: string;
    surname?: string;
    username?: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
    displayName?: string;
  } | null;
  userName?: string;
  userEmail?: string;
  startTime: string;
  endTime: string;
  status?: ReservationStatus;
}

export const STATUS: Record<
  ReservationStatus,
  { label: string; tone: BadgeTone }
> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  CONFIRMED: { label: "Confirmada", tone: "success" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
  COMPLETED: { label: "Completada", tone: "info" },
  NO_SHOW: { label: "No asistió", tone: "danger" },
};

// Mismas reglas que client-admin
export const canConfirm = (status: ReservationStatus) => status === "PENDING";
export const canCancel = (status: ReservationStatus) =>
  status === "PENDING" || status === "CONFIRMED";

export const statusOf = (reservation: Reservation): ReservationStatus =>
  reservation.status ?? "PENDING";

export const fieldNameOf = (reservation: Reservation) =>
  typeof reservation.fieldId === "object" && reservation.fieldId?.fieldName
    ? reservation.fieldId.fieldName
    : "Cancha";

export const customerOf = (reservation: Reservation) => {
  const user = reservation.user ?? {};
  const name = [user.name, user.surname].filter(Boolean).join(" ").trim();
  return {
    displayName:
      reservation.userName ??
      user.displayName ??
      (name || user.username || "Usuario no disponible"),
    username: user.username ?? "",
    email: reservation.userEmail ?? user.email ?? "",
    phone: user.phone ?? "",
    avatar: user.profilePicture ?? "",
  };
};

export const getReservations = () => fetchAllPages<Reservation>("reservations");

export const confirmReservation = (id: string) =>
  api("admin", `reservations/${id}/confirm`, { method: "PUT" });

export const cancelReservation = (id: string) =>
  api("admin", `reservations/${id}/cancel`, { method: "PUT" });
