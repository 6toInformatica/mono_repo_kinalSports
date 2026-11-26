import { unlink } from 'node:fs/promises';
import { v2 as cloudinary } from 'cloudinary';
import type { AppConfig } from '../../config/env.ts';
import type { ImageStorage } from '../../modules/users/application/ports.ts';

// Versión publicada del avatar por defecto en Cloudinary
const DEFAULT_AVATAR_VERSION = 'v1774318088';

const removeLocalFile = async (filePath: string, warning: string) => {
  try {
    await unlink(filePath);
  } catch {
    console.warn(warning, filePath);
  }
};

/**
 * public_id de una imagen guardada. Acepta la URL de Cloudinary (como las canchas)
 * y la ruta antigua `v<versión>/<public_id>.<ext>`.
 */
const publicIdFromStored = (imagePath: string): string | null => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const marker = '/image/upload/';
    const start = imagePath.indexOf(marker);
    if (start === -1) return null;

    const segments = imagePath.slice(start + marker.length).split('/');
    const version = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const storedPath = (
      version === -1 ? segments : segments.slice(version + 1)
    ).join('/');
    return storedPath.replace(/\.[a-z0-9]+$/i, '') || null;
  }

  return imagePath.replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '') || null;
};

/** Imágenes de perfil en Cloudinary (misma carpeta y formato de ruta que auth-service) */
export const createCloudinaryImageStorage = (
  settings: AppConfig['cloudinary']
): ImageStorage => {
  cloudinary.config({
    cloud_name: settings.cloudName,
    api_key: settings.apiKey,
    api_secret: settings.apiSecret,
  });

  const defaultAvatarPath = () => {
    const filename =
      settings.defaultAvatarFilename ??
      settings.defaultAvatarPath.split('/').pop();
    return `${settings.folder}/${filename}`;
  };

  const fullUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) {
      // Sin avatar por defecto configurado no hay URL que construir
      return settings.defaultAvatarPath
        ? fullUrl(settings.defaultAvatarPath)
        : '';
    }

    const trimmed = imagePath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    const { baseUrl } = settings;
    if (trimmed.startsWith('v')) return `${baseUrl}${trimmed}`;

    const defaultFilename = settings.defaultAvatarPath.split('/').pop();
    if (
      trimmed === settings.defaultAvatarPath ||
      trimmed === defaultAvatarPath() ||
      trimmed === defaultFilename
    ) {
      return `${baseUrl}${DEFAULT_AVATAR_VERSION}/${defaultFilename}.png`;
    }

    const pathToUse = trimmed.includes('/')
      ? trimmed
      : `${settings.folder}/${trimmed}`;
    return `${baseUrl}w_400,h_400,c_fill,g_auto,q_auto,f_auto/${pathToUse}`;
  };

  return {
    async upload(filePath, fileName) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: fileName.replace(/\.[a-z0-9]+$/i, ''),
          folder: settings.folder,
          allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        });
        await removeLocalFile(
          filePath,
          'Warning: Could not delete local file:'
        );
        if (!result.secure_url) {
          throw new Error('Cloudinary no devolvió la URL de la imagen');
        }
        return result.secure_url;
      } catch (error) {
        console.error(
          'Error uploading to Cloudinary:',
          (error as Error)?.message || error
        );
        await removeLocalFile(
          filePath,
          'Warning: Could not delete local file after upload error'
        );
        throw new Error(
          `Failed to upload image to Cloudinary: ${(error as Error)?.message || ''}`
        );
      }
    },

    async delete(imagePath) {
      try {
        if (!imagePath || imagePath === settings.defaultAvatarPath) return true;
        const publicId = publicIdFromStored(imagePath);
        if (!publicId) return false;
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result;
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        return false;
      }
    },

    fullUrl,
    defaultAvatarPath,
  };
};
