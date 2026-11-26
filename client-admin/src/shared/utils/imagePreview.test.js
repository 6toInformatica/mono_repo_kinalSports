import { describe, expect, it } from 'vitest';
import { imageFileError } from './imagePreview.js';

describe('imageFileError', () => {
  it('acepta un archivo vacío y un png dentro del límite', () => {
    expect(imageFileError(null)).toBeNull();
    expect(imageFileError(new File(['ok'], 'foto.png', { type: 'image/png' }))).toBeNull();
  });

  it('rechaza formato y tamaño antes de enviar', () => {
    expect(imageFileError(new File(['gif'], 'a.gif', { type: 'image/gif' }))).toMatch(/Formato/);
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.jpg', {
      type: 'image/jpeg',
    });
    expect(imageFileError(big)).toMatch(/10 MB/);
  });
});
