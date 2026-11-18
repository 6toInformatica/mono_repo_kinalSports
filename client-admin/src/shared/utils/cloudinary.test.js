import { describe, expect, it } from 'vitest';
import { resolveCloudinaryUrl } from './cloudinary.js';

describe('resolveCloudinaryUrl', () => {
  it('ignora los logos de ejemplo del backend', () => {
    expect(resolveCloudinaryUrl('fields/kinal_sports_nyvxo5', 'local.png')).toBe('local.png');
    expect(resolveCloudinaryUrl('', 'local.png')).toBe('local.png');
  });

  it('respeta las URL completas', () => {
    expect(resolveCloudinaryUrl('https://cdn.test/logo.png')).toBe('https://cdn.test/logo.png');
  });

  it('arma la URL a partir del public_id', () => {
    expect(resolveCloudinaryUrl('/kinal_sports/teams/logo')).toBe(
      'https://res.cloudinary.com/demo/image/upload/kinal_sports/teams/logo'
    );
  });
});
