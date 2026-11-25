// Fechas en español de Guatemala, con la zona horaria del negocio
const TIME_ZONE = 'America/Guatemala';

export const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('es-GT', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-GT', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatLongDate = (date = new Date()) =>
  date.toLocaleDateString('es-GT', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** YYYY-MM-DD del día en la zona horaria del negocio */
export const businessDay = (date) =>
  new Date(date).toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

export const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  if (typeof isoString === 'string' && isoString.length >= 10) {
    return isoString.slice(0, 10);
  }
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CAPACITY_LABELS = {
  FUTBOL_5: 'Fútbol 5',
  FUTBOL_7: 'Fútbol 7',
  FUTBOL_11: 'Fútbol 11',
};

export const FIELD_TYPE_LABELS = {
  SINTETICA: 'Sintética',
  NATURAL: 'Natural',
  CONCRETO: 'Concreto',
};

export const ROLE_LABELS = {
  ADMIN_ROLE: 'Administrador',
  USER_ROLE: 'Usuario',
};

export const fullName = (user) => [user?.name, user?.surname].filter(Boolean).join(' ').trim();
