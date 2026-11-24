import { randomInt } from 'node:crypto';

// Mismo alfabeto que auth-service: sin caracteres ambiguos (0, O, I, l)
const ALPHABET = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';

/** Id de 16 caracteres compatible con auth-service: usr_ + 12 caracteres */
export const generateId = () => {
  let suffix = '';
  for (let i = 0; i < 12; i++) {
    suffix += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `usr_${suffix}`;
};
