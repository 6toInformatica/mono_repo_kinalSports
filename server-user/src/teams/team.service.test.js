import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getUserByUsername,
  getUsersByIds,
} from '../infrastructure/auth.client.js';
import { uploadImage } from '../infrastructure/cloudinary.storage.js';
import { ForbiddenError, NotFoundError } from '../shared/errors.js';
import { teamRepository } from './team.repository.js';
import {
  addMemberByUsername,
  assertTeamCaptain,
  createTeam,
  enrichTeam,
  joinTeam,
  leaveTeam,
  removeMemberByCaptain,
} from './team.service.js';

vi.mock('./team.repository.js', () => ({
  teamRepository: {
    findById: vi.fn(),
    findManager: vi.fn(),
    create: vi.fn(async (data) => data),
    save: vi.fn(async (team) => team),
  },
}));
vi.mock('../infrastructure/auth.client.js', () => ({
  getUsersByIds: vi.fn(async () => new Map()),
  getUserByUsername: vi.fn(),
}));
vi.mock('../infrastructure/cloudinary.storage.js', () => ({
  uploadImage: vi.fn(),
}));

const repo = vi.mocked(teamRepository);

/** Equipo de Fútbol 7 con capitán usr_cap y un miembro más */
const aTeam = (overrides = {}) => ({
  teamName: 'Informática FC',
  category: 'FUTBOL_7',
  managerId: 'usr_cap',
  members: ['usr_cap', 'usr_2'],
  namedMembers: [],
  isActive: true,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('createTeam', () => {
  it('crea el equipo con el usuario como capitán y primer miembro', async () => {
    const team = await createTeam('usr_cap', {
      teamName: 'Informática FC',
      category: 'FUTBOL_7',
      namedMembers: '["Kevin Ajú", " ", "Pablo Sic"]',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        managerId: 'usr_cap',
        members: ['usr_cap'],
        namedMembers: [{ name: 'Kevin Ajú' }, { name: 'Pablo Sic' }],
      })
    );
    expect(team.memberProfiles[0]).toMatchObject({ isCaptain: true });
  });

  it('valida los datos antes de subir el logo', async () => {
    await expect(
      createTeam('usr_cap', { teamName: 'X', category: 'FUTBOL_5' }, {})
    ).rejects.toThrow('FUTBOL_7 o FUTBOL_11');
    await expect(
      createTeam('usr_cap', { category: 'FUTBOL_7' })
    ).rejects.toThrow('requeridos');
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('guarda la URL completa del logo subido', async () => {
    vi.mocked(uploadImage).mockResolvedValue({
      secure_url: 'https://cdn.test/logo.png',
    });

    await createTeam(
      'usr_cap',
      { teamName: 'X', category: 'FUTBOL_11' },
      { buffer: Buffer.from('x'), originalname: 'logo.png' }
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ logo: 'https://cdn.test/logo.png' })
    );
  });
});

describe('joinTeam', () => {
  it('agrega al usuario si hay cupo', async () => {
    const team = aTeam();
    repo.findById.mockResolvedValue(team);

    await joinTeam('t1', 'usr_3');

    expect(team.members).toContain('usr_3');
    expect(repo.save).toHaveBeenCalled();
  });

  it('respeta el cupo de 12 en Fútbol 7', async () => {
    const members = Array.from({ length: 12 }, (_, i) => `usr_${i}`);
    repo.findById.mockResolvedValue(aTeam({ members }));

    await expect(joinTeam('t1', 'usr_nuevo')).rejects.toThrow(
      'cupo máximo de 12'
    );
  });

  it.each([
    [
      'un equipo inactivo',
      aTeam({ isActive: false }),
      'usr_3',
      'no está disponible',
    ],
    ['si ya es miembro', aTeam(), 'usr_2', 'Ya eres miembro'],
  ])('rechaza unirse a %s', async (_case, team, userId, message) => {
    repo.findById.mockResolvedValue(team);

    await expect(joinTeam('t1', userId)).rejects.toThrow(message);
  });

  it('responde 404 si el equipo no existe', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(joinTeam('t1', 'usr_3')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('leaveTeam', () => {
  it('quita al miembro del equipo', async () => {
    const team = aTeam();
    repo.findById.mockResolvedValue(team);

    await leaveTeam('t1', 'usr_2');

    expect(team.members).toEqual(['usr_cap']);
  });

  it('el capitán no puede abandonar su equipo', async () => {
    repo.findById.mockResolvedValue(aTeam());

    await expect(leaveTeam('t1', 'usr_cap')).rejects.toThrow('manager');
  });

  it('no se puede abandonar un equipo al que no se pertenece', async () => {
    repo.findById.mockResolvedValue(aTeam());

    await expect(leaveTeam('t1', 'usr_9')).rejects.toThrow('No perteneces');
  });
});

describe('acciones del capitán', () => {
  it('assertTeamCaptain responde 403 a quien no es capitán', async () => {
    repo.findManager.mockResolvedValue({ managerId: 'usr_cap' });

    await expect(assertTeamCaptain('t1', 'usr_cap')).resolves.toBeUndefined();
    await expect(assertTeamCaptain('t1', 'usr_2')).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it('agrega a un usuario de la app por su username', async () => {
    vi.mocked(getUserByUsername).mockResolvedValue({ Id: 'usr_5' });
    const team = aTeam();
    repo.findById.mockResolvedValue(team);

    await addMemberByUsername('t1', 'valeria.lopez');

    expect(team.members).toContain('usr_5');
  });

  it('rechaza un username que no existe', async () => {
    vi.mocked(getUserByUsername).mockResolvedValue(null);

    await expect(addMemberByUsername('t1', 'nadie')).rejects.toThrow(
      'no encontrado'
    );
  });

  it('no puede quitar al capitán', async () => {
    repo.findById.mockResolvedValue(aTeam());

    await expect(removeMemberByCaptain('t1', 'usr_cap')).rejects.toThrow(
      'capitán'
    );
  });
});

describe('enrichTeam', () => {
  it('agrega el nombre del capitán y los perfiles de los miembros en una sola consulta', async () => {
    vi.mocked(getUsersByIds).mockResolvedValue(
      new Map([
        ['usr_cap', { username: 'andrea.morales' }],
        ['usr_2', { Name: 'José', Surname: 'Pérez' }],
      ])
    );

    const team = await enrichTeam(
      aTeam({ members: ['usr_cap', 'usr_2', 'usr_x'] })
    );

    expect(getUsersByIds).toHaveBeenCalledTimes(1);
    expect(team.managerName).toBe('andrea.morales');
    expect(team.memberProfiles).toEqual([
      {
        userId: 'usr_cap',
        displayName: 'andrea.morales',
        username: 'andrea.morales',
        isCaptain: true,
      },
      {
        userId: 'usr_2',
        displayName: 'José Pérez',
        username: null,
        isCaptain: false,
      },
      // Sin perfil en auth se muestra "Miembro", nunca el id técnico
      {
        userId: 'usr_x',
        displayName: 'Miembro',
        username: null,
        isCaptain: false,
      },
    ]);
  });
});
