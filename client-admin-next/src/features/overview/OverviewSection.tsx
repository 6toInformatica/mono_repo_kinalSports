"use client";

import Link from "next/link";
import { businessDay, formatLongDate } from "@/shared/lib/format";
import { useResource } from "@/shared/lib/use-resource";
import {
  Badge,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  TableSkeleton,
} from "@/shared/ui/feedback";
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

function MetricCell({
  label,
  value,
  meta,
  href,
  attention = false,
}: {
  label: string;
  value: number;
  meta: string;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-2 bg-white px-5 py-4 transition-colors hover:bg-surface/60"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
        {attention && (
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-attention"
          />
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-3xl font-bold leading-none tabular-nums text-ink">
          {value}
        </span>
        <span className="text-xs font-medium text-ink-soft transition-colors group-hover:text-brand">
          {meta} →
        </span>
      </div>
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

      {loading ? (
        <Skeleton className="h-[88px] rounded-[14px]" />
      ) : (
        <div className="grid overflow-hidden rounded-[14px] border border-line bg-line gap-px sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell
            label="Por confirmar"
            value={pending.length}
            meta={pending.length === 1 ? "1 solicitud" : "Revisar"}
            href="/dashboard/reservations"
            attention={pending.length > 0}
          />
          <MetricCell
            label="Agenda de hoy"
            value={todays.length}
            meta="Ver horario"
            href="/dashboard/reservations"
          />
          <MetricCell
            label="Canchas activas"
            value={data.fields.length}
            meta="Instalaciones"
            href="/dashboard/fields"
          />
          <MetricCell
            label="Torneos en curso"
            value={openTournaments.length}
            meta="Calendario"
            href="/dashboard/tournaments"
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Por confirmar
              </h2>
              {!loading && pending.length > 0 && (
                <Badge tone="warning" dot>
                  {pending.length}{" "}
                  {pending.length === 1 ? "pendiente" : "pendientes"}
                </Badge>
              )}
            </div>
            {!loading && pending.length > 0 && (
              <Link
                href="/dashboard/reservations"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Ver todas las reservas
              </Link>
            )}
          </div>
          {loading ? (
            <TableCard>
              <TableSkeleton columns={5} rows={4} />
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
              <table className="w-full">
                <thead className="bg-surface">
                  <tr>
                    <th className={TH}>Cliente</th>
                    <th className={TH}>Cancha</th>
                    <th className={TH}>Fecha</th>
                    <th className={TH}>Horario</th>
                    <th className={`${TH} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 6).map((reservation) => (
                    <ReservationRow
                      key={reservation._id}
                      reservation={reservation}
                      showStatus={false}
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
