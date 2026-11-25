import { useState } from 'react';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { useUIStore } from '../../auth/store/uiStore.js';
import { useFieldsStore } from '../../users/store/adminStore';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Badge } from '../../../shared/components/ui/feedback.jsx';
import { Avatar } from '../../../shared/components/ui/table.jsx';
import { TD } from '../../../shared/components/ui/uiConstants.js';
import {
  STATUS,
  canCancel,
  canConfirm,
  customerOf,
  fieldNameOf,
  statusOf,
} from '../utils/reservationHelpers.js';

/** Fila de reserva con sus acciones; la usan la sección y la vista general */
export function ReservationRow({ reservation, showDate = true, showStatus = true }) {
  const { confirmReservation, cancelReservation } = useFieldsStore();
  const { openConfirm } = useUIStore();
  const [busy, setBusy] = useState(null);
  const status = statusOf(reservation);
  const customer = customerOf(reservation);

  const execute = async (action) => {
    setBusy(action);
    try {
      await (action === 'confirm' ? confirmReservation : cancelReservation)(reservation._id);
      showSuccess(action === 'confirm' ? 'Reserva confirmada' : 'Reserva cancelada');
    } catch {
      showError(
        action === 'confirm' ? 'No se pudo confirmar la reserva' : 'No se pudo cancelar la reserva'
      );
    } finally {
      setBusy(null);
    }
  };

  const run = (action) => {
    if (action === 'cancel') {
      openConfirm({
        title: 'Cancelar reserva',
        message: `¿Cancelar la reserva de ${customer.displayName} en ${fieldNameOf(reservation)}?`,
        confirmLabel: 'Cancelar reserva',
        danger: true,
        onConfirm: () => execute('cancel'),
      });
      return;
    }
    void execute('confirm');
  };

  return (
    <tr className='border-t border-line'>
      <td className={TD}>
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar src={customer.avatar} />
          <div className='min-w-0'>
            <p className='truncate font-semibold'>{customer.displayName}</p>
            <p className='truncate text-xs text-ink-soft'>
              {customer.username ? `@${customer.username}` : customer.email}
            </p>
          </div>
        </div>
      </td>
      <td className={TD}>{fieldNameOf(reservation)}</td>
      {showDate && (
        <td className={`${TD} whitespace-nowrap`}>{formatDate(reservation.startTime)}</td>
      )}
      <td className={`${TD} whitespace-nowrap tabular-nums`}>
        {formatTime(reservation.startTime)} – {formatTime(reservation.endTime)}
      </td>
      {showStatus && (
        <td className={TD}>
          <Badge tone={STATUS[status]?.tone ?? 'neutral'} dot>
            {STATUS[status]?.label ?? status}
          </Badge>
        </td>
      )}
      <td className={`${TD} text-right`}>
        <div className='flex justify-end gap-2'>
          {canConfirm(status) && (
            <Button
              size='sm'
              loading={busy === 'confirm'}
              disabled={busy !== null}
              onClick={() => run('confirm')}
            >
              Confirmar
            </Button>
          )}
          {canCancel(status) && (
            <Button
              size='sm'
              variant='danger-outline'
              loading={busy === 'cancel'}
              disabled={busy !== null}
              onClick={() => run('cancel')}
            >
              Cancelar
            </Button>
          )}
          {!canConfirm(status) && !canCancel(status) && (
            <span className='text-xs text-ink-soft'>—</span>
          )}
        </div>
      </td>
    </tr>
  );
}
