import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../common/errors.js';
import { ReservationEnricher } from './reservation.enricher.js';
import { ReservationRepository } from './reservation.repository.js';
import { ReservationService } from './reservation.service.js';

const repo = {
  findPage: vi.fn(),
  findByIdWithField: vi.fn(),
  findById: vi.fn(),
  findConflicts: vi.fn(async () => []),
  saveWithField: vi.fn(async (r) => r),
};
const enricher = {
  enrichOne: vi.fn(async (r) => r),
  enrichMany: vi.fn(async (list) => list),
};

const pending = (overrides = {}) => ({
  _id: 'r1',
  userId: 'usr_2',
  fieldId: 'f1',
  status: 'PENDING',
  startTime: new Date(Date.now() + 864e5),
  endTime: new Date(Date.now() + 864e5 + 72e5),
  ...overrides,
});

let service: ReservationService;

beforeEach(async () => {
  vi.clearAllMocks();
  const moduleRef = await Test.createTestingModule({
    providers: [
      ReservationService,
      { provide: ReservationRepository, useValue: repo },
      { provide: ReservationEnricher, useValue: enricher },
    ],
  }).compile();
  service = moduleRef.get(ReservationService);
});

describe('list', () => {
  it('arma filtros y paginación', async () => {
    repo.findPage.mockResolvedValue({ items: [{}, {}], total: 25 });

    const result = await service.list({
      page: '2',
      limit: '10',
      status: 'PENDING',
      date: '2027-01-10',
    });

    const [filter, options] = repo.findPage.mock.calls[0]!;
    expect(filter.status).toBe('PENDING');
    expect(
      filter.startTime.$lt.getTime() - filter.startTime.$gte.getTime()
    ).toBe(864e5);
    expect(options).toEqual({ skip: 10, limit: 10 });
    expect(result.pagination).toEqual({
      currentPage: 2,
      totalPages: 3,
      totalRecords: 25,
      limit: 10,
    });
  });
});

describe('getById', () => {
  it('el dueño y el admin pueden verla; otro usuario no', async () => {
    repo.findByIdWithField.mockResolvedValue(pending());

    await expect(
      service.getById('r1', { id: 'usr_2', role: 'USER_ROLE' })
    ).resolves.toBeTruthy();
    await expect(
      service.getById('r1', { id: 'usr_x', role: 'ADMIN_ROLE' })
    ).resolves.toBeTruthy();
    await expect(
      service.getById('r1', { id: 'usr_9', role: 'USER_ROLE' })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('responde 404 si no existe', async () => {
    repo.findByIdWithField.mockResolvedValue(null);

    await expect(
      service.getById('r1', { id: 'usr_2', role: 'USER_ROLE' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('confirm', () => {
  it('confirma una reserva pendiente y registra quién la confirmó', async () => {
    const reservation = pending();
    repo.findById.mockResolvedValue(reservation);

    await service.confirm('r1', 'usr_admin');

    expect(reservation).toMatchObject({
      status: 'CONFIRMED',
      lastModifiedBy: 'usr_admin',
      confirmation: { confirmedBy: 'usr_admin' },
    });
    expect(repo.saveWithField).toHaveBeenCalledWith(reservation);
  });

  it('no confirma si el horario ya está ocupado (409)', async () => {
    repo.findById.mockResolvedValue(pending());
    repo.findConflicts.mockResolvedValueOnce([
      { _id: 'r2', startTime: 's', endTime: 'e', status: 'CONFIRMED' },
    ] as never);

    await expect(service.confirm('r1', 'usr_admin')).rejects.toBeInstanceOf(
      ConflictError
    );
    expect(repo.saveWithField).not.toHaveBeenCalled();
  });

  it.each([
    ['ya confirmada', pending({ status: 'CONFIRMED' }), 'estado: CONFIRMED'],
    [
      'que ya inició',
      pending({ startTime: new Date(Date.now() - 1000) }),
      'ya inició',
    ],
  ])('no confirma una reserva %s', async (_case, reservation, message) => {
    repo.findById.mockResolvedValue(reservation);

    await expect(service.confirm('r1', 'usr_admin')).rejects.toThrow(message);
  });
});

describe('cancel', () => {
  it.each(['PENDING', 'CONFIRMED'])(
    'cancela una reserva %s',
    async (status) => {
      const reservation = pending({ status });
      repo.findById.mockResolvedValue(reservation);

      await service.cancel('r1', 'usr_admin');

      expect(reservation.status).toBe('CANCELLED');
    }
  );

  it('no cancela una reserva ya terminada', async () => {
    repo.findById.mockResolvedValue(pending({ status: 'COMPLETED' }));

    const error = await service.cancel('r1', 'usr_admin').catch((e) => e);
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.details).toEqual({ error: error.message });
  });
});
