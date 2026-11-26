import { beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import { createCloudinaryImageStorage } from './cloudinary-image.storage.ts';

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

const settings = {
  cloudName: 'demo',
  apiKey: 'key',
  apiSecret: 'secret',
  baseUrl: 'https://res.cloudinary.com/demo/image/upload/',
  folder: 'auth_service/profiles',
  defaultAvatarPath: 'auth_service/profiles/avatarDefault.png',
  defaultAvatarFilename: 'avatarDefault.png',
};

const secureUrl =
  'https://res.cloudinary.com/demo/image/upload/v9/auth_service/profiles/profile-abc.png';

describe('cloudinary image storage', () => {
  const storage = createCloudinaryImageStorage(settings);

  beforeEach(() => {
    vi.mocked(cloudinary.uploader.upload).mockReset();
    vi.mocked(cloudinary.uploader.destroy).mockReset();
  });

  it('guarda la secure_url, igual que las canchas', async () => {
    vi.mocked(cloudinary.uploader.upload).mockResolvedValue({
      secure_url: secureUrl,
    } as never);

    await expect(
      storage.upload('/tmp/foto.png', 'profile-abc.png')
    ).resolves.toBe(secureUrl);
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
      '/tmp/foto.png',
      expect.objectContaining({
        public_id: 'profile-abc',
        folder: 'auth_service/profiles',
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
      })
    );
    expect(storage.fullUrl(secureUrl)).toBe(secureUrl);
  });

  it('borra una foto guardada como URL de Cloudinary', async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({
      result: 'ok',
    } as never);

    await storage.delete(secureUrl);

    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'auth_service/profiles/profile-abc'
    );
  });

  it('sigue resolviendo la ruta antigua con versión', () => {
    expect(storage.fullUrl('v9/auth_service/profiles/profile-abc.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/v9/auth_service/profiles/profile-abc.png'
    );
  });
});
