import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Env } from '../config/env.validation.js';
import { CloudinaryService } from './cloudinary.service.js';

const service = new CloudinaryService({
  get: () => undefined,
} as unknown as ConfigService<Env, true>);

describe('CloudinaryService.publicIdFromUrl', () => {
  it.each([
    [
      'https://res.cloudinary.com/demo/image/upload/v1712/kinal_sports/teams/logo.png',
      'kinal_sports/teams/logo',
    ],
    [
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v1712/fields/foto.jpg',
      'fields/foto',
    ],
    [
      'https://res.cloudinary.com/demo/image/upload/sin-version.webp',
      'sin-version',
    ],
  ])('%s → %s', (url, publicId) => {
    expect(service.publicIdFromUrl(url)).toBe(publicId);
  });

  it('no toca el logo por defecto ni URLs ajenas', () => {
    expect(service.publicIdFromUrl('fields/kinal_sports_nyvxo5')).toBeNull();
    expect(service.publicIdFromUrl('https://otro.cdn/img.png')).toBeNull();
  });
});
