import { randomBytes } from 'node:crypto';

/**
 * Token aleatorio de 256 bits en base64url sin relleno, igual que TokenGenerator de .NET.
 * Se usa para verificar el email y recuperar la contraseña.
 */
export const generateSecureToken = () => randomBytes(32).toString('base64url');
