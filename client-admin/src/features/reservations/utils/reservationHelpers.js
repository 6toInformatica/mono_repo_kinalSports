export const STATUS = {
  PENDING: { label: 'Pendiente', tone: 'warning' },
  CONFIRMED: { label: 'Confirmada', tone: 'success' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
  COMPLETED: { label: 'Completada', tone: 'info' },
  NO_SHOW: { label: 'No asistió', tone: 'danger' },
};

export const canConfirm = (status) => status === 'PENDING';
export const canCancel = (status) => status === 'PENDING' || status === 'CONFIRMED';

export const statusOf = (reservation) => reservation.status ?? 'PENDING';

export const fieldNameOf = (reservation) =>
  typeof reservation.fieldId === 'object' && reservation.fieldId?.fieldName
    ? reservation.fieldId.fieldName
    : 'Cancha';

export const customerOf = (reservation) => {
  const user = reservation.user ?? {};
  const name = [user.name, user.surname].filter(Boolean).join(' ').trim();
  return {
    displayName:
      reservation.userName ??
      user.displayName ??
      (name || user.username || 'Usuario no disponible'),
    username: user.username ?? '',
    email: reservation.userEmail ?? user.email ?? '',
    phone: user.phone ?? '',
    avatar: user.profilePicture ?? '',
  };
};
