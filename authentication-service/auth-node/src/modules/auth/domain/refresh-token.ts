export interface RefreshToken {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Vigencia del refresh token (igual que auth-service) */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Vigencia del access token: 15 minutos */
export const ACCESS_TOKEN_TTL_SECONDS = 900;
