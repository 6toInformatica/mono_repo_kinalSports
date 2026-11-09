import type { RefreshToken } from '../domain/refresh-token.ts';

export interface RefreshTokenRepository {
  /** Emite un token nuevo en la familia indicada (o en una nueva) y devuelve el valor en claro */
  issue(
    userId: string,
    familyId?: string
  ): Promise<{ raw: string; familyId: string }>;
  findByRawToken(raw: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  /** Acepta hashes de Node y de auth-service (.NET) */
  verify(hash: string, password: string): Promise<boolean>;
}

export interface AccessTokenClaims {
  sub: string;
}

export interface TokenService {
  /** JWT HS256 con sub, jti, iat y role, compatible con auth-service */
  createAccessToken(userId: string, role: string): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
}

export interface EmailSender {
  sendVerification(email: string, name: string, token: string): Promise<void>;
  sendPasswordReset(email: string, name: string, token: string): Promise<void>;
  sendWelcome(email: string, name: string): Promise<void>;
  sendPasswordChanged(email: string, name: string): Promise<void>;
}
