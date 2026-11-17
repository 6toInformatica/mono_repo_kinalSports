import { describe, expect, it, vi } from 'vitest';
import { makeChangeUserRole } from './change-user-role.ts';

const user = { id: 'usr_SeedUser0002', username: 'andrea.morales' };

const setup = (found: unknown = user) => {
  const users = { findById: vi.fn().mockResolvedValue(found) };
  const roles = { setUserSingleRole: vi.fn().mockResolvedValue(undefined) };
  const present = vi.fn((u) => ({ presented: u }));
  const changeUserRole = makeChangeUserRole({
    users,
    roles,
    present,
  } as unknown as Parameters<typeof makeChangeUserRole>[0]);
  return { changeUserRole, users, roles, present };
};

describe('changeUserRole', () => {
  it('asigna el rol y devuelve el usuario actualizado', async () => {
    const { changeUserRole, roles, present } = setup();

    const result = await changeUserRole(user.id, 'ADMIN_ROLE');

    expect(roles.setUserSingleRole).toHaveBeenCalledWith(user.id, 'ADMIN_ROLE');
    expect(present).toHaveBeenCalledWith(user);
    expect(result).toEqual({ presented: user });
  });

  it('devuelve null y no toca los roles si el usuario no existe', async () => {
    const { changeUserRole, roles } = setup(null);

    expect(await changeUserRole('usr_NoExiste0000', 'USER_ROLE')).toBeNull();
    expect(roles.setUserSingleRole).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio (último administrador)', async () => {
    const { changeUserRole, roles } = setup();
    roles.setUserSingleRole.mockRejectedValue(new Error('último admin'));

    await expect(changeUserRole(user.id, 'USER_ROLE')).rejects.toThrow(
      'último admin'
    );
  });
});
