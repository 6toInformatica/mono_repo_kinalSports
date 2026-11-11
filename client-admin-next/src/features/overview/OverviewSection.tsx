"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { businessDay, formatLongDate } from "@/shared/lib/format";
import { useResource } from "@/shared/lib/use-resource";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { CalendarIcon, FieldIcon, TrophyIcon } from "@/shared/ui/icons";
import { TH, TableCard } from "@/shared/ui/table";
import { getFields, type Field } from "../fields/api";
import {
  fieldNameOf,
  getReservations,
  statusOf,
  type Reservation,
} from "../reservations/api";
import { ReservationRow } from "../reservations/ReservationRow";
import { getTournaments, type Tournament } from "../tournaments/api";

const load = async () => {
  const [reservations, fields, tournaments] = await Promise.all([
    getReservations(),
    getFields(),
    getTournaments(),
  ]);
  return { reservations, fields, tournaments };
};

function Stat({
  label,
  value,
  icon: Icon,
  href,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-[14px] border bg-white p-5 transition hover:border-brand ${highlight ? "border-attention/60" : "border-line"}`}
    >
      <span
        className={`flex size-11 items-center justify-center rounded-xl ${highlight ? "bg-amber-100 text-amber-800" : "bg-brand-soft text-brand"}`}
      >
        <Icon />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[28px] font-bold leading-none text-ink tabular-nums">
          {value}
        </span>
        <span className="mt-1 text-sm text-ink-soft">{label}</span>
      </span>
    </Link>
  );
}

export function OverviewSection({ firstName }: { firstName?: string }) {
  const { data, loading, error, reload } = useResource(load, {
    reservations: [] as Reservation[],
    fields: [] as Field[],
    tournaments: [] as Tournament[],
  });

  const today = businessDay(new Date());
  const pending = data.reservations
    .filter((reservation) => statusOf(reservation) === "PENDING")
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todays = data.reservations.filter(
    (reservation) =>
      businessDay(reservation.startTime) === today &&
      !["CANCELLED", "NO_SHOW"].includes(statusOf(reservation)),
  );
  const openTournaments = data.tournaments.filter(
    (tournament) => businessDay(tournament.endDate) >= today,
  );

  const occupancy = data.fields
    .map((field) => ({
      name: field.fieldName,
      count: todays.filter(
        (reservation) => fieldNameOf(reservation) === field.fieldName,
      ).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...occupancy.map((item) => item.count));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Vista general"}
        description={`Resumen de hoy, ${formatLongDate(new Date())}`}
      />
      {error && <ErrorState message={error} onRetry={() => void reload()} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[90px] rounded-[14px]" />
          ))
        ) : (
          <>
            <Stat
              label="Reservas por confirmar"
              value={pending.length}
              icon={CalendarIcon}
              href="/dashboard/reservations"
              highlight={pending.length > 0}
            />
            <Stat
              label="Reservas de hoy"
              value={todays.length}
              icon={CalendarIcon}
              href="/dashboard/reservations"
            />
            <Stat
              label="Canchas activas"
              value={data.fields.length}
              icon={FieldIcon}
              href="/dashboard/fields"
            />
            <Stat
              label="Torneos abiertos"
              value={openTournaments.length}
              icon={TrophyIcon}
              href="/dashboard/tournaments"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Por confirmar
          </h2>
          {loading ? (
            <TableCard>
              <TableSkeleton columns={6} rows={4} />
            </TableCard>
          ) : pending.length === 0 ? (
            <EmptyState
              title="Todo al día"
              message="No hay reservas pendientes de confirmar."
            />
          ) : (
            <TableCard
              footer={
                pending.length > 6 ? (
                  <Link
                    href="/dashboard/reservations"
                    className="text-sm font-semibold text-brand"
                  >
                    Ver las {pending.length} reservas pendientes
                  </Link>
                ) : undefined
              }
            >
              <table className="w-full min-w-[760px]">
                <thead className="bg-surface">
                  <tr>
                    <th className={TH}>Cliente</th>
                    <th className={TH}>Cancha</th>
                    <th className={TH}>Fecha</th>
                    <th className={TH}>Horario</th>
                    <th className={TH}>Estado</th>
                    <th className={`${TH} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 6).map((reservation) => (
                    <ReservationRow
                      key={reservation._id}
                      reservation={reservation}
                      onChanged={() => void reload({ silent: true })}
                    />
                  ))}
                </tbody>
              </table>
            </TableCard>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Ocupación de hoy
          </h2>
          <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-5">
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-8" />
              ))
            ) : occupancy.length === 0 ? (
              <p className="text-sm text-ink-soft">No hay canchas activas.</p>
            ) : (
              occupancy.map((item) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{item.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink">
                      {item.count} reserva{item.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
