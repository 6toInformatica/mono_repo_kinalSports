import { describe, expect, it } from 'vitest';
import {
  getBusinessDayRange,
  validateBusinessHours,
  validateMaxDuration,
  validateMinDuration,
} from './reservation.rules.js';

// Guatemala es UTC-6 todo el año
const req = (startTime) => ({ req: { body: { startTime } } });

describe('validateBusinessHours(6, 22)', () => {
  const validate = validateBusinessHours(6, 22);

  it('acepta una reserva de 10:00 a 12:00 hora de Guatemala', () => {
    expect(
      validate('2026-12-01T12:00:00-06:00', req('2026-12-01T10:00:00-06:00'))
    ).toBe(true);
  });

  it('rechaza una reserva que termina después de las 22:00', () => {
    expect(() =>
      validate('2026-12-01T23:00:00-06:00', req('2026-12-01T21:00:00-06:00'))
    ).toThrow('entre las 6:00 y las 22:00');
  });

  it('rechaza una reserva antes de las 6:00', () => {
    expect(() =>
      validate('2026-12-01T07:00:00-06:00', req('2026-12-01T05:00:00-06:00'))
    ).toThrow();
  });
});

describe('duración', () => {
  it('rechaza menos de 60 minutos', () => {
    expect(() =>
      validateMinDuration(60)(
        '2026-12-01T10:30:00-06:00',
        req('2026-12-01T10:00:00-06:00')
      )
    ).toThrow('mínima');
  });

  it('rechaza más de 180 minutos', () => {
    expect(() =>
      validateMaxDuration(180)(
        '2026-12-01T14:00:00-06:00',
        req('2026-12-01T10:00:00-06:00')
      )
    ).toThrow('máxima');
  });
});

describe('getBusinessDayRange', () => {
  it('devuelve el día completo en hora de Guatemala (06:00 UTC a 06:00 UTC)', () => {
    const { start, end } = getBusinessDayRange('2026-12-01');
    expect(start.toISOString()).toBe('2026-12-01T06:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-02T06:00:00.000Z');
  });
});
