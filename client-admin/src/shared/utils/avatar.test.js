import { describe, expect, it } from 'vitest';
import { isDefaultAvatarUrl, resolveAvatarUrl } from './avatar.js';

describe('resolveAvatarUrl', () => {
  it('devuelve el fallback si no hay valor', () => {
    expect(resolveAvatarUrl('', 'fallback.png')).toBe('fallback.png');
    expect(resolveAvatarUrl(null, 'fallback.png')).toBe('fallback.png');
  });

  it('respeta las URL completas', () => {
    expect(resolveAvatarUrl('https://cdn.test/a.png')).toBe('https://cdn.test/a.png');
  });

  it('arma la URL de Cloudinary a partir del public_id', () => {
    expect(resolveAvatarUrl('/auth_service/profiles/abc')).toBe(
      'https://res.cloudinary.com/demo/image/upload/auth_service/profiles/abc'
    );
  });
});

describe('isDefaultAvatarUrl', () => {
  it('detecta el avatar por defecto y los valores vacíos', () => {
    expect(isDefaultAvatarUrl('auth_service/profiles/avatarDefault-1749508519496_oam3k3')).toBe(
      true
    );
    expect(isDefaultAvatarUrl('')).toBe(true);
    expect(isDefaultAvatarUrl('auth_service/profiles/foto-real')).toBe(false);
  });
});
