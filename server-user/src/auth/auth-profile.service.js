'use strict';

import dotenv from 'dotenv';

dotenv.config();

const authBaseUrl =
  process.env.AUTH_NODE_URL ??
  process.env.AUTH_SERVICE_URL ??
  'http://localhost:3007/api/v1';

export const uploadProfilePictureToAuth = async (file, authorizationHeader) => {
  const formData = new FormData();
  formData.append(
    'profilePicture',
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname
  );

  const response = await fetch(`${authBaseUrl}/auth/profile/picture`, {
    method: 'POST',
    headers: {
      Authorization: authorizationHeader,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || 'Error al actualizar foto de perfil'
    );
    error.status = response.status;
    error.response = { status: response.status, data };
    throw error;
  }

  return data?.data ?? data;
};
