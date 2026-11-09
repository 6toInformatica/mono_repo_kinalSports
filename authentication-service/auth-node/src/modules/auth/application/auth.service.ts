import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { config as legacyConfig } from '../../../../configs/config.js';
import {
  getDefaultAvatarPath,
  uploadImage,
} from '../../../../helpers/cloudinary-service.js';
import {
  sendPasswordChangedEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../../../../helpers/email-service.js';
import { generateJWT } from '../../../../helpers/generate-jwt.js';
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../../../../utils/auth-helpers.js';
import {
  hashPassword,
  verifyPassword,
} from '../../../../utils/password-utils.js';
import { USER_ROLE } from '../../roles/domain/roles.ts';
import { buildUserResponse } from '../../users/application/user-response.ts';
import { userRepository } from '../../users/infrastructure/user.repository.ts';
import { refreshTokenRepository } from '../infrastructure/refresh-token.repository.ts';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const ACCESS_TOKEN_TTL = '15m';
const ACCESS_TOKEN_TTL_SECONDS = 900;

export interface RegisterInput {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  /** Ruta del archivo subido o URL/ruta de Cloudinary */
  profilePicture: string | null;
}

/** Tarea en segundo plano: si falla se registra, pero no afecta la respuesta */
const inBackground = (label: string, task: () => Promise<unknown>) => {
  Promise.resolve()
    .then(task)
    .catch((error) =>
      console.error(`Async email send (${label}) failed:`, error)
    );
};

/**
 * Qué guardar como foto de perfil al registrarse: un archivo local se sube a Cloudinary;
 * una URL o ruta de Cloudinary se normaliza a solo el nombre del archivo.
 */
const resolveProfilePicture = async (profilePicture: string | null) => {
  if (!profilePicture) return profilePicture;

  const uploadPath: string = legacyConfig.upload.uploadPath;
  const isLocalFile =
    profilePicture.includes('uploads/') ||
    profilePicture.includes(uploadPath) ||
    profilePicture.startsWith('./');

  if (isLocalFile) {
    try {
      const ext = path.extname(profilePicture);
      const cloudinaryFileName = `profile-${randomBytes(6).toString('hex')}${ext}`;
      return await uploadImage(profilePicture, cloudinaryFileName);
    } catch (error) {
      console.error(
        'Error uploading profile picture to Cloudinary during registration:',
        error
      );
      return null;
    }
  }

  const baseUrl: string = legacyConfig.cloudinary.baseUrl || '';
  const folder: string = legacyConfig.cloudinary.folder || '';
  let normalized = profilePicture;
  if (normalized.startsWith(baseUrl))
    normalized = normalized.slice(baseUrl.length);
  if (folder && normalized.startsWith(`${folder}/`)) {
    normalized = normalized.slice(folder.length + 1);
  }
  return normalized.split('/').pop() ?? null;
};

export const registerUser = async (input: RegisterInput) => {
  const { email, username, password, name, surname, phone } = input;

  if (await userRepository.existsByEmailOrUsername(email, username)) {
    throw new Error('Ya existe un usuario con este email o nombre de usuario');
  }

  const profilePicture = await resolveProfilePicture(input.profilePicture);

  // El hash (Argon2id, ~100 MB de memoria) se calcula antes de abrir la transacción
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw new Error('Error al crear usuario');
  }

  const newUser = await userRepository.create({
    name,
    surname,
    username,
    email,
    passwordHash,
    phone,
    profilePicture: profilePicture || getDefaultAvatarPath(),
    roleName: USER_ROLE,
  });
  if (!newUser) throw new Error('Error al crear usuario');

  const verificationToken = generateEmailVerificationToken();
  await userRepository.setEmailVerificationToken(
    newUser.id,
    verificationToken,
    new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
  );

  inBackground('verification', () =>
    sendVerificationEmail(email, name, verificationToken)
  );

  // Sin JWT: la sesión empieza en el login (igual que RegisterResponseDto de .NET)
  return {
    success: true,
    user: buildUserResponse(newUser),
    message:
      'Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.',
    emailVerificationRequired: true,
  };
};

export const loginUser = async (emailOrUsername: string, password: string) => {
  const user = await userRepository.findByEmailOrUsername(emailOrUsername);
  if (!user || !(await verifyPassword(user.password, password))) {
    throw new Error('Credenciales inválidas');
  }

  if (!user.userEmail?.emailVerified) {
    throw new Error(
      'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada o reenvía el email de verificación.'
    );
  }

  if (!user.status) {
    throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
  }

  const role = user.userRoles[0]?.role.name || USER_ROLE;
  const accessToken = await generateJWT(
    user.id,
    { role },
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  const { raw: refreshToken } = await refreshTokenRepository.issue(user.id);

  const fullUser = buildUserResponse(user);
  return {
    success: true,
    message: 'Login exitoso',
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    userDetails: {
      id: fullUser.id,
      username: fullUser.username,
      email: fullUser.email,
      name: fullUser.name,
      surname: fullUser.surname,
      profilePicture: fullUser.profilePicture,
      role: fullUser.role,
    },
  };
};

export const verifyEmail = async (token: string) => {
  if (!token || token.length < 40) {
    throw new Error('Token inválido para verificación de email');
  }

  const user = await userRepository.findByEmailVerificationToken(token);
  if (!user) throw new Error('Usuario no encontrado o token inválido');
  if (!user.userEmail) throw new Error('Registro de email no encontrado');
  if (user.userEmail.emailVerified) {
    throw new Error('El email ya ha sido verificado');
  }

  await userRepository.markEmailAsVerified(user.id);
  inBackground('welcome', () => sendWelcomeEmail(user.email, user.name));

  return {
    success: true,
    message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
    data: { email: user.email, verified: true },
  };
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado',
        data: { email, sent: false },
      };
    }

    if (user.userEmail?.emailVerified) {
      return {
        success: false,
        message: 'El email ya ha sido verificado',
        data: { email: user.email, verified: true },
      };
    }

    const verificationToken = generateEmailVerificationToken();
    await userRepository.setEmailVerificationToken(
      user.id,
      verificationToken,
      new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
    );

    // Envío síncrono para poder informar si falla
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
      return {
        success: true,
        message: 'Email de verificación enviado exitosamente',
        data: { email: user.email, sent: true },
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return {
        success: false,
        message:
          'Error al enviar el email de verificación. Por favor, intenta nuevamente más tarde.',
        data: { email: user.email, sent: false },
      };
    }
  } catch (error) {
    console.error('Error en resendVerificationEmail:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
      data: { email, sent: false },
    };
  }
};

export const forgotPassword = async (email: string) => {
  // Por seguridad la respuesta es la misma exista o no el usuario
  const response = {
    success: true,
    message: 'Si el email existe, se ha enviado un enlace de recuperación',
    data: { email, initiated: true },
  };

  try {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) return response;

    const resetToken = generatePasswordResetToken();
    await userRepository.setPasswordResetToken(
      user.id,
      resetToken,
      new Date(Date.now() + PASSWORD_RESET_TTL_MS)
    );

    inBackground('password reset', () =>
      sendPasswordResetEmail(user.email, user.name, resetToken)
    );
  } catch (error) {
    console.error('Error en forgotPassword:', error);
  }
  return response;
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (!token || token.length < 40) {
    throw new Error('Token inválido para reset de contraseña');
  }

  const user = await userRepository.findByPasswordResetToken(token);
  if (!user) throw new Error('Usuario no encontrado o token inválido');
  if (!user.userPasswordReset?.passwordResetToken) {
    throw new Error('Token de reset inválido o ya utilizado');
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(user.id, passwordHash);

  inBackground('password changed', () =>
    sendPasswordChangedEmail(user.email, user.name)
  );

  return {
    success: true,
    message: 'Contraseña actualizada exitosamente',
    data: { email: user.email, reset: true },
  };
};
