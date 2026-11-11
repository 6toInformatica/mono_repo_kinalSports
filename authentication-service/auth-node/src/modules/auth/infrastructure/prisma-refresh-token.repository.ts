import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { PrismaClient } from '../../../infrastructure/database/prisma.ts';
import type { RefreshTokenRepository } from '../application/ports.ts';
import { REFRESH_TOKEN_TTL_MS } from '../domain/refresh-token.ts';

/** En la base solo se guarda el SHA-256 del token (igual que auth-service) */
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  readonly #db: PrismaClient;

  constructor(db: PrismaClient) {
    this.#db = db;
  }

  /** Token de 64 caracteres hex dentro de la familia indicada (o de una nueva) */
  async issue(userId: string, familyId: string = randomUUID()) {
    const raw = randomBytes(32).toString('hex');
    await this.#db.refreshToken.create({
      data: {
        tokenHash: hashToken(raw),
        userId,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        createdAt: new Date(),
      },
    });
    return { raw, familyId };
  }

  findByRawToken(raw: string) {
    return this.#db.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      select: {
        id: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }

  async revoke(id: string) {
    await this.#db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string) {
    await this.#db.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
  }
}
