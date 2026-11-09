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

/** Imágenes de perfil en Cloudinary (misma carpeta y formato de ruta que auth-service) */
export const createCloudinaryImageStorage = (
  settings: AppConfig['cloudinary']
): ImageStorage => {
  // Se omite la validación del certificado TLS (decisión vigente del proyecto).
  // Afecta a todo el proceso, igual que en la versión anterior.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
          public_id: fileName,
          folder: settings.folder,
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
        return `v${result.version}/${result.public_id}.${result.format}`;
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
        const publicId = imagePath
          .replace(/^v\d+\//, '')
          .replace(/\.[a-z0-9]+$/i, '');
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
