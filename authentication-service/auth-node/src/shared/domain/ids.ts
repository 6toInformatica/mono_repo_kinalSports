import { randomBytes } from 'node:crypto';

// Mismo alfabeto que auth-service: sin caracteres ambiguos (0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

/** Id de 16 caracteres compatible con auth-service: usr_ + 12 caracteres */
export const generateId = () => {
  const bytes = randomBytes(12);
  let suffix = '';
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];
  return `usr_${suffix}`;
};
