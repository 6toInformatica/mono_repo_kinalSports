import { useEffect, useMemo, useState } from 'react';
import { useFieldsStore } from '../../users/store/adminStore';
import { showError } from '../../../shared/utils/toast.js';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from '../../../shared/components/ui/feedback.jsx';
import { SelectField, TextField } from '../../../shared/components/ui/fields.jsx';
import { FilterBar, Pagination, TableCard } from '../../../shared/components/ui/table.jsx';
import { TH, paginate } from '../../../shared/components/ui/uiConstants.js';
import { ReservationRow } from './ReservationRow.jsx';
import { STATUS, customerOf, fieldNameOf, statusOf } from '../utils/reservationHelpers.js';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = Object.entries(STATUS).map(([value, { label }]) => ({
  value,
  label,
}));

export const Reservations = () => {
  const { reservations, loading, error, getAllReservations } = useFieldsStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAllReservations().catch(() => {});
  }, [getAllReservations]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...reservations]
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
  }, [reservations, search, status]);

  const view = paginate(filtered, page, PAGE_SIZE);

  return (
    <section className='flex flex-col gap-6'>
      <PageHeader title='Reservas' description='Confirma o cancela las reservas de las canchas' />
      <FilterBar>
        <TextField
          label='Buscar'
          type='search'
          placeholder='Cliente, usuario o cancha'
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className='w-full sm:w-72'
        />
        <SelectField
          label='Estado'
          value={status}
          placeholder='Todos los estados'
          options={STATUS_OPTIONS}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className='w-full sm:w-52'
        />
      </FilterBar>

      {error && <ErrorState message={error} onRetry={() => void getAllReservations()} />}

      {loading && reservations.length === 0 ? (
        <TableCard>
          <TableSkeleton columns={6} />
        </TableCard>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          title='Sin reservas'
          message={
            search || status
              ? 'Ninguna reserva coincide con los filtros.'
              : 'Aún no hay reservas registradas.'
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
          <table className='w-full min-w-[760px]'>
            <thead className='bg-surface'>
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
                <ReservationRow key={reservation._id} reservation={reservation} />
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  );
};
