import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../shared/errors.js';
import { reservationRepository } from './reservation.repository.js';
import {
  cancelReservation,
  createReservation,
  getOccupiedSlots,
} from './reservation.service.js';

vi.mock('./reservation.repository.js', () => ({
  reservationRepository: {
    findConflicts: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    findOwnedBy: vi.fn(),
    save: vi.fn((r) => r),
    findHistory: vi.fn(),
    findOccupiedSlots: vi.fn(),
  },
}));

const repo = vi.mocked(reservationRepository);
const input = {
  fieldId: 'field1',
  startTime: '2027-01-10T10:00:00-06:00',
  endTime: '2027-01-10T12:00:00-06:00',
};

beforeEach(() => vi.clearAllMocks());

describe('createReservation', () => {
  it('crea la reserva como PENDING a nombre del usuario', async () => {
    repo.findConflicts.mockResolvedValue([]);
    repo.create.mockImplementation(async (data) => ({ _id: 'b', ...data }));

    const reservation = await createReservation('usr_1', input);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        status: 'PENDING',
        lastModifiedBy: 'usr_1',
      })
    );
    expect(reservation.status).toBe('PENDING');
  });

  it('rechaza un horario ocupado (409) e incluye los conflictos', async () => {
    repo.findConflicts.mockResolvedValue([
      { _id: 'x', startTime: 's', endTime: 'e', status: 'CONFIRMED' },
    ]);

    const error = await createReservation('usr_1', input).catch((e) => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.status).toBe(409);
    expect(error.details.conflicts).toEqual([
      { id: 'x', startTime: 's', endTime: 'e', status: 'CONFIRMED' },
    ]);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('si pierde una carrera con otra reserva simultánea, se borra y responde 409', async () => {
    repo.findConflicts
      .mockResolvedValueOnce([]) // chequeo previo
      .mockResolvedValueOnce([{ _id: 'a' }]); // la otra se creó antes ('a' < 'b')
    repo.create.mockImplementation(async (data) => ({ _id: 'b', ...data }));

    await expect(createReservation('usr_1', input)).rejects.toBeInstanceOf(
      ConflictError
    );
    expect(repo.deleteById).toHaveBeenCalledWith('b');
  });

  it('si gana la carrera, la reserva se conserva', async () => {
    repo.findConflicts
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ _id: 'c' }]); // la otra se creó después
    repo.create.mockImplementation(async (data) => ({ _id: 'b', ...data }));

    await expect(createReservation('usr_1', input)).resolves.toMatchObject({
      _id: 'b',
    });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});

describe('cancelReservation', () => {
  const future = () => new Date(Date.now() + 864e5);

  it('cancela una reserva futura del usuario', async () => {
    repo.findOwnedBy.mockResolvedValue({
      status: 'CONFIRMED',
      startTime: future(),
    });

    const result = await cancelReservation('r1', 'usr_1');

    expect(result).toMatchObject({
      status: 'CANCELLED',
      lastModifiedBy: 'usr_1',
    });
  });

  it('responde 404 si la reserva no existe o es de otro usuario', async () => {
    repo.findOwnedBy.mockResolvedValue(null);

    await expect(cancelReservation('r1', 'usr_1')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it.each(['CANCELLED', 'COMPLETED', 'NO_SHOW'])(
    'no cancela una reserva %s',
    async (status) => {
      repo.findOwnedBy.mockResolvedValue({ status, startTime: future() });

      await expect(cancelReservation('r1', 'usr_1')).rejects.toThrow(
        `estado ${status}`
      );
    }
  );

  it('no cancela una reserva que ya inició', async () => {
    repo.findOwnedBy.mockResolvedValue({
      status: 'PENDING',
      startTime: new Date(Date.now() - 1000),
    });

    await expect(cancelReservation('r1', 'usr_1')).rejects.toBeInstanceOf(
      BadRequestError
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('getOccupiedSlots', () => {
  it('consulta el día completo en hora de Guatemala', async () => {
    await getOccupiedSlots('field1', '2027-01-10');

    expect(repo.findOccupiedSlots).toHaveBeenCalledWith(
      'field1',
      new Date('2027-01-10T06:00:00Z'),
      new Date('2027-01-11T06:00:00Z')
    );
  });
});
