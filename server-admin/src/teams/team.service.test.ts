import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClientService } from '../integrations/auth-client.service.js';
import { CloudinaryService } from '../integrations/cloudinary.service.js';
import { TEAM_MODEL } from './schemas/team.schema.js';
import { TeamService } from './team.service.js';

const logo = { buffer: Buffer.from('x'), originalname: 'logo.png' } as never;

/** Modelo de Mongoose falso: documentos con validate/save y métodos estáticos */
const saved: Record<string, unknown>[] = [];
let failSave = false;
class FakeTeamModel {
  [key: string]: unknown;
  constructor(data: Record<string, unknown>) {
    Object.assign(this, data);
  }
  validate = vi.fn(async () => {});
  save = vi.fn(async () => {
    if (failSave) throw new Error('duplicado');
    saved.push({ ...this });
    return this;
  });
  static findById = vi.fn();
  static findByIdAndUpdate = vi.fn(async (_id, changes) => ({ ...changes }));
}

const auth = { userExists: vi.fn(async () => true) };
const images = {
  upload: vi.fn(async () => ({ secure_url: 'https://cdn.test/nuevo.png' })),
  destroyByUrl: vi.fn(),
};

let service: TeamService;

beforeEach(async () => {
  vi.clearAllMocks();
  saved.length = 0;
  failSave = false;
  const moduleRef = await Test.createTestingModule({
    providers: [
      TeamService,
      { provide: getModelToken(TEAM_MODEL), useValue: FakeTeamModel },
      { provide: AuthClientService, useValue: auth },
      { provide: CloudinaryService, useValue: images },
      { provide: ConfigService, useValue: { get: () => 'kinal_sports/teams' } },
    ],
  }).compile();
  service = moduleRef.get(TeamService);
});

describe('create', () => {
  it('incluye al capitán entre los miembros y sube el logo', async () => {
    const team = await service.create(
      {
        teamName: 'Informática FC',
        managerId: 'usr_cap',
        members: ['usr_2'],
        namedMembers: '["Kevin Ajú"]',
      },
      logo
    );

    expect(team.members).toEqual(['usr_2', 'usr_cap']);
    expect(team.namedMembers).toEqual([{ name: 'Kevin Ajú' }]);
    expect(team.logo).toBe('https://cdn.test/nuevo.png');
    expect(images.upload).toHaveBeenCalledWith(logo, 'kinal_sports/teams');
  });

  it('rechaza un capitán sin cuenta antes de subir nada', async () => {
    auth.userExists.mockResolvedValueOnce(false);

    await expect(
      service.create({ teamName: 'X', managerId: 'usr_x' }, logo)
    ).rejects.toThrow('no existe');
    expect(images.upload).not.toHaveBeenCalled();
  });

  it('si falla el guardado, borra el logo recién subido', async () => {
    failSave = true;

    await expect(
      service.create({ teamName: 'X', managerId: 'usr_cap' }, logo)
    ).rejects.toThrow('duplicado');
    expect(images.destroyByUrl).toHaveBeenCalledWith(
      'https://cdn.test/nuevo.png'
    );
  });
});

describe('update', () => {
  it('ignora los campos protegidos y reemplaza el logo anterior', async () => {
    FakeTeamModel.findById.mockResolvedValue({
      logo: 'https://cdn.test/viejo.png',
    });

    const updated = await service.update(
      't1',
      { teamName: 'Nuevo', isActive: false, managerId: 'usr_x', members: [] },
      logo
    );

    expect(updated).toEqual({
      teamName: 'Nuevo',
      logo: 'https://cdn.test/nuevo.png',
    });
    expect(images.destroyByUrl).toHaveBeenCalledWith(
      'https://cdn.test/viejo.png'
    );
  });

  it('devuelve null si el equipo no existe', async () => {
    FakeTeamModel.findById.mockResolvedValue(null);

    expect(await service.update('t1', {})).toBeNull();
  });
});

describe('changeManager', () => {
  it('el nuevo capitán pasa a ser miembro', async () => {
    const team = new FakeTeamModel({
      managerId: 'usr_cap',
      members: ['usr_cap'],
    });
    FakeTeamModel.findById.mockResolvedValue(team);

    await service.changeManager('t1', 'usr_nuevo');

    expect(team.managerId).toBe('usr_nuevo');
    expect(team.members).toEqual(['usr_cap', 'usr_nuevo']);
  });

  it('rechaza un capitán sin cuenta', async () => {
    auth.userExists.mockResolvedValueOnce(false);

    await expect(service.changeManager('t1', 'usr_x')).rejects.toThrow(
      'no existe'
    );
  });
});
