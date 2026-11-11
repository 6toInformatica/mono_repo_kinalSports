"use client";

import { useMemo, useState } from "react";
import { useResource } from "@/shared/lib/use-resource";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { SelectField, TextField } from "@/shared/ui/fields";
import {
  FilterBar,
  Pagination,
  TH,
  TableCard,
  paginate,
} from "@/shared/ui/table";
import {
  STATUS,
  customerOf,
  fieldNameOf,
  getReservations,
  statusOf,
  type Reservation,
} from "./api";
import { ReservationRow } from "./ReservationRow";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({
  value,
  label,
}));

export function ReservationsSection() {
  const { data, loading, error, reload } = useResource(
    getReservations,
    [] as Reservation[],
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...data]
      .filter((reservation) => !status || statusOf(reservation) === status)
      .filter((reservation) => {
        if (!term) return true;
        const customer = customerOf(reservation);
        return [
          customer.displayName,
          customer.username,
          customer.email,
          fieldNameOf(reservation),
        ].some((value) => value.toLowerCase().includes(term));
      })
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  }, [data, search, status]);

  const view = paginate(filtered, page, PAGE_SIZE);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Reservas"
        description="Confirma o cancela las reservas de las canchas"
      />
      <FilterBar>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Cliente, usuario o cancha"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="w-full sm:w-72"
        />
        <SelectField
          label="Estado"
          value={status}
          placeholder="Todos los estados"
          options={STATUS_OPTIONS}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="w-full sm:w-52"
        />
      </FilterBar>
      {error && <ErrorState message={error} onRetry={() => void reload()} />}
      {loading ? (
        <TableCard>
          <TableSkeleton columns={6} />
        </TableCard>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          title="Sin reservas"
          message={
            search || status
              ? "Ninguna reserva coincide con los filtros."
              : "Aún no hay reservas registradas."
          }
        />
      ) : (
        <TableCard
          footer={
            <Pagination
              page={view.current}
              totalPages={view.totalPages}
              total={filtered.length}
              onChange={setPage}
            />
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
              {view.items.map((reservation) => (
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
    </section>
  );
}
