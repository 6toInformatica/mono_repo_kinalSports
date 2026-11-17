import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TeamUpdateGuard } from './team-update.guard.js';
import type { TeamService } from './team.service.js';

const TEAM_ID = '5eed7e000000000000000001';

const run = async (
  user: { id: string; role: string } | undefined,
  team: { managerId: string } | null | Error = { managerId: 'usr_cap' },
  id = TEAM_ID
) => {
  const findManager = vi.fn(async () => {
    if (team instanceof Error) throw team;
    return team;
  });
  const guard = new TeamUpdateGuard({ findManager } as unknown as TeamService);
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ user, params: { id } }) }),
  } as unknown as ExecutionContext;

  try {
    return { allowed: await guard.canActivate(context), findManager };
  } catch (error) {
    return { status: (error as HttpException).getStatus(), findManager };
  }
};

describe('TeamUpdateGuard', () => {
  it('el admin puede editar cualquier equipo', async () => {
    const result = await run({ id: 'usr_admin', role: 'ADMIN_ROLE' });

    expect(result.allowed).toBe(true);
    expect(result.findManager).not.toHaveBeenCalled();
  });

  it('el capitán puede editar su propio equipo', async () => {
    expect((await run({ id: 'usr_cap', role: 'USER_ROLE' })).allowed).toBe(
      true
    );
  });

  it('un usuario no puede editar el equipo de otro (403)', async () => {
    expect((await run({ id: 'usr_2', role: 'USER_ROLE' })).status).toBe(403);
  });

  it('responde 404 si el equipo no existe', async () => {
    expect((await run({ id: 'usr_2', role: 'USER_ROLE' }, null)).status).toBe(
      404
    );
  });

  it('responde 401 sin usuario y 403 con un rol desconocido', async () => {
    expect((await run(undefined)).status).toBe(401);
    expect((await run({ id: 'x', role: 'INTERNAL_SERVICE' })).status).toBe(403);
  });

  it('un id inválido lo deja a la validación de la ruta', async () => {
    const result = await run({ id: 'usr_2', role: 'USER_ROLE' }, null, 'abc');

    expect(result.allowed).toBe(true);
    expect(result.findManager).not.toHaveBeenCalled();
  });

  it('un error de la base responde 500', async () => {
    const result = await run(
      { id: 'usr_2', role: 'USER_ROLE' },
      new Error('db caída')
    );
    expect(result.status).toBe(500);
  });
});
