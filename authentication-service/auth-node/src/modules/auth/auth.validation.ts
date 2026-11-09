import { rule } from '../../http/validation.ts';

const LETTERS_AND_SPACES = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

export const registerSchema = [
  {
    field: 'name',
    trim: true,
    rules: [
      rule.notEmpty('El nombre es obligatorio'),
      rule.length({ max: 25 }, 'El nombre no puede tener más de 25 caracteres'),
      rule.matches(
        LETTERS_AND_SPACES,
        'El nombre solo puede contener letras y espacios'
      ),
    ],
  },
  {
    field: 'surname',
    trim: true,
    rules: [
      rule.notEmpty('El apellido es obligatorio'),
      rule.length(
        { max: 25 },
        'El apellido no puede tener más de 25 caracteres'
      ),
      rule.matches(
        LETTERS_AND_SPACES,
        'El apellido solo puede contener letras y espacios'
      ),
    ],
  },
  {
    field: 'username',
    trim: true,
    rules: [
      rule.notEmpty('El nombre de usuario es obligatorio'),
      rule.length(
        { max: 50 },
        'El nombre de usuario no puede tener más de 50 caracteres'
      ),
    ],
  },
  {
    field: 'email',
    trim: true,
    rules: [
      rule.notEmpty('El correo electrónico es obligatorio'),
      rule.email('El correo electrónico no tiene un formato válido'),
      rule.length(
        { max: 150 },
        'El correo electrónico no puede tener más de 150 caracteres'
      ),
    ],
  },
  {
    field: 'password',
    rules: [
      rule.notEmpty('La contraseña es obligatoria'),
      rule.length(
        { min: 8, max: 255 },
        'La contraseña debe tener entre 8 y 255 caracteres'
      ),
    ],
  },
  {
    field: 'phone',
    rules: [
      rule.notEmpty('El número de teléfono es obligatorio'),
      rule.matches(
        /^\d{8}$/,
        'El número de teléfono debe tener exactamente 8 dígitos'
      ),
    ],
  },
];

export const loginSchema = [
  {
    field: 'emailOrUsername',
    trim: true,
    rules: [rule.notEmpty('Email o nombre de usuario es requerido')],
  },
  { field: 'password', rules: [rule.notEmpty('La contraseña es requerida')] },
];

export const verifyEmailSchema = [
  {
    field: 'token',
    rules: [rule.notEmpty('El token de verificación es requerido')],
  },
];

const emailField = {
  field: 'email',
  trim: true,
  rules: [
    rule.notEmpty('El email es obligatorio'),
    rule.email('Debe proporcionar un email válido'),
  ],
};

export const resendVerificationSchema = [emailField];
export const forgotPasswordSchema = [emailField];

export const resetPasswordSchema = [
  {
    field: 'token',
    rules: [rule.notEmpty('El token de recuperación es requerido')],
  },
  {
    field: 'newPassword',
    rules: [
      rule.notEmpty('La nueva contraseña es obligatoria'),
      rule.length(
        { min: 8 },
        'La nueva contraseña debe tener al menos 8 caracteres'
      ),
    ],
  },
];
