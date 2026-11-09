import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '../../../infrastructure/database/prisma.ts';

/** Vigencia del refresh token (igual que auth-service) */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** En la base solo se guarda el SHA-256 del token */
export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const refreshTokenRepository = {
  /** Emite un token nuevo (64 caracteres hex) dentro de la familia indicada */
  async issue(userId: string, familyId: string = randomUUID()) {
    const raw = randomBytes(32).toString('hex');
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(raw),
        userId,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        createdAt: new Date(),
      },
    });
    return { raw, familyId };
  },

  findByRawToken(raw: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
    });
  },

  async revoke(id: string) {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeFamily(familyId: string) {
    await prisma.refreshToken.updateMany({
      where: { familyId },
      data: { revokedAt: new Date() },
    });
  },
};
