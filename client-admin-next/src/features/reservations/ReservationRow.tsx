"use client";

import { useState } from "react";
import { formatDate, formatTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { useConfirm } from "@/shared/ui/confirm";
import { Badge } from "@/shared/ui/feedback";
import { Avatar, TD } from "@/shared/ui/table";
import { useToast } from "@/shared/ui/toast";
import {
  STATUS,
  canCancel,
  canConfirm,
  cancelReservation,
  confirmReservation,
  customerOf,
  fieldNameOf,
  statusOf,
  type Reservation,
} from "./api";

/** Fila de reserva con sus acciones; la usan la sección y la vista general */
export function ReservationRow({
  reservation,
  onChanged,
  showDate = true,
}: {
  reservation: Reservation;
  onChanged: () => void;
  showDate?: boolean;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const status = statusOf(reservation);
  const customer = customerOf(reservation);

  const run = async (action: "confirm" | "cancel") => {
    if (action === "cancel") {
      const ok = await confirm({
        title: "Cancelar reserva",
        message: `¿Cancelar la reserva de ${customer.displayName} en ${fieldNameOf(reservation)}?`,
        confirmLabel: "Cancelar reserva",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(action);
    try {
      await (action === "confirm" ? confirmReservation : cancelReservation)(
        reservation._id,
      );
      toast.success(
        action === "confirm" ? "Reserva confirmada" : "Reserva cancelada",
      );
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <tr className="border-t border-line">
      <td className={TD}>
        <div className="flex min-w-48 items-center gap-3">
          <Avatar src={customer.avatar} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{customer.displayName}</p>
            <p className="truncate text-xs text-ink-soft">
              {customer.username ? `@${customer.username}` : customer.email}
            </p>
          </div>
        </div>
      </td>
      <td className={TD}>{fieldNameOf(reservation)}</td>
      {showDate && (
        <td className={`${TD} whitespace-nowrap`}>
          {formatDate(reservation.startTime)}
        </td>
      )}
      <td className={`${TD} whitespace-nowrap tabular-nums`}>
        {formatTime(reservation.startTime)} – {formatTime(reservation.endTime)}
      </td>
      <td className={TD}>
        <Badge tone={STATUS[status]?.tone ?? "neutral"} dot>
          {STATUS[status]?.label ?? status}
        </Badge>
      </td>
      <td className={`${TD} text-right`}>
        <div className="flex justify-end gap-2">
          {canConfirm(status) && (
            <Button
              size="sm"
              loading={busy === "confirm"}
              disabled={busy !== null}
              onClick={() => void run("confirm")}
            >
              Confirmar
            </Button>
          )}
          {canCancel(status) && (
            <Button
              size="sm"
              variant="danger-outline"
              loading={busy === "cancel"}
              disabled={busy !== null}
              onClick={() => void run("cancel")}
            >
              Cancelar
            </Button>
          )}
          {!canConfirm(status) && !canCancel(status) && (
            <span className="text-xs text-ink-soft">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}
