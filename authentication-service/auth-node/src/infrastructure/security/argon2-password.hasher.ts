import { timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import type { PasswordHasher } from '../../modules/auth/application/ports.ts';

/** Parámetros Argon2id idénticos a auth-service (.NET) */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 102400, // 100 MB
  timeCost: 2,
  parallelism: 8,
  hashLength: 32,
} as const;

/**
 * Verifica a mano un hash generado por .NET ($argon2id$v=19$m=..,t=..,p=..$salt$hash),
 * por si su codificación difiere de la que acepta argon2.verify.
 */
const verifyDotnetHash = async (hash: string, password: string) => {
  const parts = hash.split('$');
  const [, , , paramsPart, saltPart, hashPart] = parts;
  if (parts.length !== 6 || !paramsPart || !saltPart || !hashPart) return false;

  const params = Object.fromEntries(
    paramsPart.split(',').map((param) => {
      const [key, value] = param.split('=');
      return [key, Number(value)];
    })
  );
  const expected = Buffer.from(hashPart, 'base64');
  const computed = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: params.m,
    timeCost: params.t,
    parallelism: params.p,
    hashLength: expected.length,
    salt: Buffer.from(saltPart, 'base64'),
    raw: true,
  });

  return (
    computed.length === expected.length && timingSafeEqual(computed, expected)
  );
};

export const argon2PasswordHasher: PasswordHasher = {
  async hash(password) {
    try {
      return await argon2.hash(password, HASH_OPTIONS);
    } catch {
      throw new Error('Error al hashear la contraseña');
    }
  },

  async verify(hash, password) {
    try {
      try {
        if (await argon2.verify(hash, password)) return true;
      } catch {
        // Formato no reconocido: se intenta como hash de .NET
      }
      if (hash.startsWith('$argon2id$v=19$')) {
        return await verifyDotnetHash(hash, password);
      }
      return false;
    } catch (error) {
      console.error('Password verification error:', (error as Error).message);
      return false;
    }
  },
};
