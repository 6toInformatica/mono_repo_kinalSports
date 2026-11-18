import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminTournament } from '../infrastructure/admin.client.js';
import { teamRepository } from '../teams/team.repository.js';
import { tournamentRepository } from './tournament.repository.js';
import { registerTeam } from './tournament.service.js';

vi.mock('../infrastructure/admin.client.js', () => ({
  getAdminTournament: vi.fn(),
}));
vi.mock('../teams/team.repository.js', () => ({
  teamRepository: { findById: vi.fn(), findIdsByMember: vi.fn() },
}));
vi.mock('./tournament.repository.js', () => ({
  tournamentRepository: {
    findById: vi.fn(),
    create: vi.fn(async (data) => ({ ...data, teams: [] })),
    save: vi.fn(),
  },
}));

const TEAM_ID = '5eed7e000000000000000001';
const TOURNAMENT_ID = '5eed70000000000000000002';

const openTournament = (overrides = {}) => ({
  success: true,
  data: {
    tournamentsName: 'Liga Kinal Apertura 2027',
    category: 'FUTBOL_11',
    status: 'PENDIENTE',
    isActive: true,
    startDate: new Date(Date.now() + 10 * 864e5).toISOString(),
    endDate: new Date(Date.now() + 90 * 864e5).toISOString(),
    ...overrides,
  },
});

const team = (overrides = {}) => ({
  teamName: 'Electricidad Industrial',
  managerId: 'usr_cap',
  category: 'FUTBOL_11',
  isActive: true,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(teamRepository.findById).mockResolvedValue(team());
  vi.mocked(getAdminTournament).mockResolvedValue(openTournament());
  vi.mocked(tournamentRepository.findById).mockResolvedValue(null);
});

describe('registerTeam', () => {
  it('inscribe al equipo y guarda una copia local del torneo', async () => {
    const result = await registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_cap');

    expect(tournamentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ _id: TOURNAMENT_ID, category: 'FUTBOL_11' })
    );
    expect(result.tournament.teams).toEqual([TEAM_ID]);
    expect(result.teamName).toBe('Electricidad Industrial');
  });

  it('rechaza un teamId que no es un ObjectId sin consultar la base', async () => {
    await expect(
      registerTeam(TOURNAMENT_ID, { $ne: null }, 'usr_cap')
    ).rejects.toThrow('Equipo no encontrado');
    expect(teamRepository.findById).not.toHaveBeenCalled();
  });

  it('solo el capitán puede inscribir', async () => {
    await expect(registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_2')).rejects.toThrow(
      'Solo el capitán'
    );
  });

  it('la categoría del equipo debe coincidir', async () => {
    vi.mocked(teamRepository.findById).mockResolvedValue(
      team({ category: 'FUTBOL_7' })
    );

    await expect(
      registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_cap')
    ).rejects.toThrow('categoría');
  });

  it.each([
    ['ya empezó', { status: 'EN PROGRESO' }],
    ['está inactivo', { isActive: false }],
    [
      'tiene fecha pasada',
      { startDate: new Date(Date.now() - 1000).toISOString() },
    ],
  ])('rechaza un torneo que %s', async (_case, overrides) => {
    vi.mocked(getAdminTournament).mockResolvedValue(openTournament(overrides));

    await expect(
      registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_cap')
    ).rejects.toThrow('no está disponible para inscripción');
  });

  it('convierte un 404 de server-admin en 400 "Torneo no encontrado"', async () => {
    vi.mocked(getAdminTournament).mockRejectedValue({
      response: { status: 404 },
    });

    const error = await registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_cap').catch(
      (e) => e
    );
    expect(error.status).toBe(400);
    expect(error.message).toBe('Torneo no encontrado');
  });

  it('no inscribe dos veces al mismo equipo', async () => {
    vi.mocked(tournamentRepository.findById).mockResolvedValue({
      teams: [TEAM_ID],
    });

    await expect(
      registerTeam(TOURNAMENT_ID, TEAM_ID, 'usr_cap')
    ).rejects.toThrow('ya está inscrito');
    expect(tournamentRepository.save).not.toHaveBeenCalled();
  });
});
