'use strict';

// Reglas de negocio de reservas
export const MIN_DURATION_MINUTES = 60;
export const MAX_DURATION_MINUTES = 180;
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 22;

export const validateEndTimeAfterStartTime = (endTimeValue, { req }) => {
  const start = new Date(req.body.startTime);
  const end = new Date(endTimeValue);

  if (end <= start) {
    throw new Error('endTime debe ser posterior a startTime');
  }

  return true;
};

export const validateFutureDate = (dateValue) => {
  const inputDate = new Date(dateValue);
  const now = new Date();

  if (inputDate < now) {
    throw new Error('La fecha no puede estar en el pasado');
  }

  return true;
};

// Zona horaria del negocio (Guatemala no usa horario de verano)
export const BUSINESS_TIMEZONE =
  process.env.BUSINESS_TIMEZONE || 'America/Guatemala';

/**
 * Minutos desde la medianoche en la zona horaria del negocio.
 */
const getLocalMinutes = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  return hour * 60 + minute;
};

/**
 * Valida que la reserva esté dentro del horario de atención (mismo día).
 */
export const validateBusinessHours = (openHour, closeHour) => {
  return (endTimeValue, { req }) => {
    const start = new Date(req.body.startTime);
    const end = new Date(endTimeValue);
    const startMinutes = getLocalMinutes(start);
    const endMinutes = getLocalMinutes(end);

    if (
      startMinutes < openHour * 60 ||
      endMinutes > closeHour * 60 ||
      endMinutes <= startMinutes
    ) {
      throw new Error(
        `Las reservas deben estar entre las ${openHour}:00 y las ${closeHour}:00`
      );
    }

    return true;
  };
};

/**
 * Rango [inicio, fin) de un día (YYYY-MM-DD) en la zona horaria del negocio.
 */
export const getBusinessDayRange = (date) => {
  const day = String(date).slice(0, 10);
  const probe = new Date(`${day}T12:00:00Z`);
  const offsetMinutes =
    getLocalMinutes(probe) - (probe.getUTCHours() * 60 + probe.getUTCMinutes());
  const start = new Date(
    Date.parse(`${day}T00:00:00Z`) - offsetMinutes * 60 * 1000
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

export const validateMinDuration = (minMinutes) => {
  return (endTimeValue, { req }) => {
    const start = new Date(req.body.startTime);
    const end = new Date(endTimeValue);
    const durationMs = end - start;
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < minMinutes) {
      throw new Error(`La duración mínima debe ser de ${minMinutes} minutos`);
    }

    return true;
  };
};

export const validateMaxDuration = (maxMinutes) => {
  return (endTimeValue, { req }) => {
    const start = new Date(req.body.startTime);
    const end = new Date(endTimeValue);
    const durationMs = end - start;
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes > maxMinutes) {
      throw new Error(`La duración máxima debe ser de ${maxMinutes} minutos`);
    }

    return true;
  };
};
