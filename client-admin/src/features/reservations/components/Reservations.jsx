import { useEffect } from 'react';
import { useFieldsStore } from '../../users/store/adminStore';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import { Spinner } from '../../auth/components/Spinner.jsx';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { showConfirmToast } from '../../../shared/utils/showConfirmToast.js';
import defaultAvatarImg from '../../../assets/img/avatarDefault-1749508519496.png';
import { resolveAvatarUrl } from '../../../shared/utils/avatar.js';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió',
};

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-200',
};

const getReservationUser = (reservation) => {
  const user = reservation.user ?? {};
  const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim();

  return {
    displayName:
      reservation.userName ??
      user.displayName ??
      (fullName || user.username || 'Usuario no disponible'),
    username: user.username ?? '',
    email: reservation.userEmail ?? user.email ?? '',
    phone: user.phone ?? '',
    avatar: user.profilePicture ?? '',
  };
};

export const Reservations = () => {
  const {
    reservations,
    loading,
    error,
    getAllReservations,
    confirmReservation,
    cancelReservation,
  } = useFieldsStore();

  useEffect(() => {
    getAllReservations();
  }, [getAllReservations]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  if (loading && reservations.length === 0) return <Spinner />;

  return (
    <div className='p-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-main-blue'>Gestión de Reservaciones</h1>
        <p className='text-gray-500 text-sm'>Administra y confirma las reservaciones pendientes</p>
      </div>

      <div className='grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
        {reservations.map((reservation) => {
          const status = reservation.status ?? 'PENDING';
          const canConfirm = status === 'PENDING';
          const canCancel = status === 'PENDING' || status === 'CONFIRMED';
          const fieldName = reservation.fieldId?.fieldName ?? 'Cancha';
          const user = getReservationUser(reservation);

          return (
            <article
              key={reservation._id}
              className='bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col h-full overflow-hidden'
            >
              <div className='px-5 pt-5 pb-4 border-b border-gray-100'>
                <div className='flex items-start justify-between gap-3'>
                  <h2 className='text-lg font-bold text-main-blue leading-tight'>{fieldName}</h2>
                  <span
                    className={`shrink-0 px-2.5 py-1 text-xs rounded-full font-semibold border ${STATUS_STYLES[status] ?? STATUS_STYLES.PENDING}`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>
              </div>

              <div className='px-5 py-4 flex-1 flex flex-col gap-4'>
                <div className='flex items-center gap-3'>
                  <img
                    src={resolveAvatarUrl(user.avatar)}
                    alt={user.displayName}
                    className='w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0'
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = defaultAvatarImg;
                    }}
                  />
                  <div className='min-w-0'>
                    <p className='font-semibold text-gray-800 truncate'>{user.displayName}</p>
                    {user.username ? (
                      <p className='text-sm text-gray-500 truncate'>@{user.username}</p>
                    ) : null}
                    {user.email ? (
                      <p className='text-xs text-gray-400 truncate'>{user.email}</p>
                    ) : null}
                    {user.phone ? <p className='text-xs text-gray-400'>{user.phone}</p> : null}
                  </div>
                </div>

                <div className='rounded-lg bg-gray-50 px-4 py-3 space-y-2'>
                  <div className='flex items-center justify-between gap-3 text-sm'>
                    <span className='text-gray-500'>Fecha</span>
                    <span className='font-medium text-gray-800'>
                      {formatDate(reservation.startTime)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between gap-3 text-sm'>
                    <span className='text-gray-500'>Horario</span>
                    <span className='font-medium text-gray-800 text-right'>
                      {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='px-5 pb-5 mt-auto'>
                {canConfirm || canCancel ? (
                  <div className='flex gap-3'>
                    {canConfirm ? (
                      <button
                        onClick={() =>
                          showConfirmToast({
                            title: 'Confirmar reserva',
                            message: '¿Estás seguro de confirmar esta reserva?',
                            onConfirm: async () => {
                              try {
                                await confirmReservation(reservation._id);
                                showSuccess('Reserva confirmada correctamente');
                              } catch {
                                showError('No se pudo confirmar la reserva');
                              }
                            },
                          })
                        }
                        className='flex-1 py-2.5 rounded-lg bg-main-blue text-white font-medium hover:opacity-90 transition'
                      >
                        Confirmar
                      </button>
                    ) : null}

                    {canCancel ? (
                      <button
                        onClick={() =>
                          showConfirmToast({
                            title: 'Cancelar reserva',
                            message: '¿Estás seguro de cancelar esta reserva?',
                            onConfirm: async () => {
                              try {
                                await cancelReservation(reservation._id);
                                showSuccess('Reserva cancelada correctamente');
                              } catch {
                                showError('No se pudo cancelar la reserva');
                              }
                            },
                          })
                        }
                        className={`py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition ${canConfirm ? 'flex-1' : 'w-full'}`}
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className='text-center text-sm text-gray-400 py-2'>
                    Esta reservación ya no admite cambios
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {reservations.length === 0 && !loading && (
        <div className='text-center text-gray-500 mt-10'>No hay reservaciones registradas</div>
      )}
    </div>
  );
};
