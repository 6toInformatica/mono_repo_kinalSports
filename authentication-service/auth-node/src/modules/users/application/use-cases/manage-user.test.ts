import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../../../shared/domain/errors.ts';
import { aUser } from '../../../../test/fakes.ts';
import { makeDeactivateUser, makeUpdateUser } from './manage-user.ts';

const setup = (user = aUser()) => {
  const users = {
    findById: vi.fn().mockResolvedValue(user),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByEmailOrUsername: vi.fn().mockResolvedValue(null),
    updateDetails: vi.fn(),
    softDelete: vi.fn(),
  };
  const roles = {
    findUsersByRole: vi.fn().mockResolvedValue([user]),
  };
  const present = vi.fn((value) => value);
  const cache = { del: vi.fn() };
  return {
    users,
    roles,
    update: makeUpdateUser({ users, roles, present, cache } as never),
    deactivate: makeDeactivateUser({ users, roles, present, cache } as never),
  };
};

describe('manageUser', () => {
  it('actualiza los datos visibles del usuario', async () => {
    const { update, users } = setup();

    await update('usr_SeedUser0002', {
      name: 'Andrea',
      surname: 'Morales',
      username: 'andrea.morales',
      email: 'andrea@kinal.edu.gt',
      phone: '42178935',
    });

    expect(users.updateDetails).toHaveBeenCalledWith('usr_SeedUser0002', {
      name: 'Andrea',
      surname: 'Morales',
      username: 'andrea.morales',
      email: 'andrea@kinal.edu.gt',
      phone: '42178935',
    });
  });

  it('no desactiva la propia cuenta ni al último administrador', async () => {
    const { deactivate, users } = setup(aUser({ roles: ['ADMIN_ROLE'] }));

    await expect(
      deactivate('usr_SeedUser0002', 'usr_SeedUser0002')
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(deactivate('usr_otro', 'usr_SeedUser0002')).rejects.toThrow(
      /último administrador/
    );
    expect(users.softDelete).not.toHaveBeenCalled();
  });

  it('marca la baja lógica de otro usuario', async () => {
    const { deactivate, users } = setup();

    await deactivate('usr_admin', 'usr_SeedUser0002');

    expect(users.softDelete).toHaveBeenCalledWith('usr_SeedUser0002');
  });
});
