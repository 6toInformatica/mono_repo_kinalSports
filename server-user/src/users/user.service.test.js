import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getUserById,
  uploadProfilePicture,
} from '../infrastructure/auth.client.js';
import { formatUserDisplayName } from '../shared/user-format.js';
import { userProfileRepository } from './user.repository.js';
import { getMyProfile, updateAvatar } from './user.service.js';

vi.mock('../infrastructure/auth.client.js', () => ({
  getUserById: vi.fn(),
  uploadProfilePicture: vi.fn(),
}));
vi.mock('./user.repository.js', () => ({
  userProfileRepository: {
    findByAuthId: vi.fn(),
    create: vi.fn(async (authId) => ({ authId })),
    upsert: vi.fn(),
  },
}));

const authUser = {
  Name: 'Andrea',
  Surname: 'Morales',
  Username: 'andrea.morales',
  Email: 'andrea.morales@kinalsports.gt',
  Phone: '42178935',
  ProfilePicture: 'https://cdn.test/a.png',
};

beforeEach(() => vi.clearAllMocks());

describe('getMyProfile', () => {
  it('crea el perfil local si no existe y lo completa con los datos de auth', async () => {
    vi.mocked(userProfileRepository.findByAuthId).mockResolvedValue(null);
    vi.mocked(getUserById).mockResolvedValue(authUser);

    const profile = await getMyProfile('usr_2');

    expect(userProfileRepository.create).toHaveBeenCalledWith('usr_2');
    expect(profile).toMatchObject({
      authId: 'usr_2',
      displayName: 'Andrea Morales',
      username: 'andrea.morales',
      email: 'andrea.morales@kinalsports.gt',
      phone: '42178935',
      avatar: 'https://cdn.test/a.png',
    });
  });

  it('respeta el nombre y teléfono que el usuario ya editó', async () => {
    vi.mocked(userProfileRepository.findByAuthId).mockResolvedValue({
      authId: 'usr_2',
      displayName: 'Andre',
      phone: '55555555',
    });
    vi.mocked(getUserById).mockResolvedValue(authUser);

    const profile = await getMyProfile('usr_2');

    expect(profile.displayName).toBe('Andre');
    expect(profile.phone).toBe('55555555');
  });

  it('si auth no responde, devuelve el perfil local tal cual', async () => {
    vi.mocked(userProfileRepository.findByAuthId).mockResolvedValue({
      authId: 'usr_2',
      displayName: 'Andre',
    });
    vi.mocked(getUserById).mockResolvedValue(null);

    expect(await getMyProfile('usr_2')).toEqual({
      authId: 'usr_2',
      displayName: 'Andre',
    });
  });
});

describe('updateAvatar', () => {
  it('sube la foto al servicio de auth y devuelve el perfil con la foto nueva', async () => {
    vi.mocked(uploadProfilePicture).mockResolvedValue({
      profilePicture: 'https://cdn.test/nueva.png',
    });
    vi.mocked(userProfileRepository.findByAuthId).mockResolvedValue({
      authId: 'usr_2',
    });
    vi.mocked(getUserById).mockResolvedValue(authUser);

    const profile = await updateAvatar('usr_2', {}, 'Bearer x');

    expect(uploadProfilePicture).toHaveBeenCalledWith({}, 'Bearer x');
    expect(profile.avatar).toBe('https://cdn.test/nueva.png');
  });
});

describe('formatUserDisplayName', () => {
  it('prefiere el username, luego el nombre completo', () => {
    expect(formatUserDisplayName({ username: ' andrea ', name: 'A' })).toBe(
      'andrea'
    );
    expect(formatUserDisplayName({ Name: 'José', Surname: 'Pérez' })).toBe(
      'José Pérez'
    );
  });

  it('nunca muestra un id técnico usr_', () => {
    expect(formatUserDisplayName({ id: 'usr_SeedUser0002' })).toBeNull();
    expect(formatUserDisplayName(null)).toBeNull();
  });
});
