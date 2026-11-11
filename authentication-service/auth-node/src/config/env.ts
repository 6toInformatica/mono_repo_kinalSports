import { existsSync } from 'node:fs';
import { z } from 'zod';

// Variables de un archivo .env local (desarrollo fuera de Docker).
// Las variables ya definidas en el entorno tienen prioridad.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().catch(fallback);

const optionalText = z
  .string()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3007),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SQL_LOGGING: z.stringbool().default(false),

  // HS256 compartido con auth-service (.NET exige al menos 256 bits)
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: optionalText,
  JWT_AUDIENCE: optionalText,

  INTERNAL_SERVICE_TOKEN: optionalText,

  ALLOWED_ORIGINS: csv,
  // Enlaces de los correos de verificación y recuperación
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: positiveInt(60_000),
  RATE_LIMIT_MAX: positiveInt(100),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_AUTH_MAX: positiveInt(30),

  UPLOAD_PATH: z.string().default('./uploads'),

  // Transporte de correo: Kinal Mail Hub (API REST) o SMTP (pruebas con Mailpit)
  MAIL_PROVIDER: z.enum(['kmh', 'smtp']).default('kmh'),
  KMH_API_BASE_URL: z.string().default('https://mail.lab.kinal.edu.gt'),
  KMH_MAIL_FROM: z
    .string()
    .default('kinal-sports@am-delta.in6am.mail.kinal.test'),
  KMH_PROJECT_API_KEY: optionalText,
  KMH_TIMEOUT_MS: positiveInt(10_000),

  SMTP_HOST: optionalText,
  SMTP_PORT: positiveInt(587),
  SMTP_ENABLE_SSL: optionalText,
  SMTP_USERNAME: optionalText,
  SMTP_PASSWORD: optionalText,
  SMTP_FROM: optionalText,
  EMAIL_FROM: optionalText,
  SMTP_FROM_NAME: optionalText,
  EMAIL_FROM_NAME: optionalText,

  CLOUDINARY_CLOUD_NAME: optionalText,
  CLOUDINARY_API_KEY: optionalText,
  CLOUDINARY_API_SECRET: optionalText,
  CLOUDINARY_BASE_URL: optionalText,
  CLOUDINARY_FOLDER: optionalText,
  CLOUDINARY_DEFAULT_AVATAR: optionalText,
  CLOUDINARY_DEFAULT_AVATAR_FILENAME: optionalText,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Configuración inválida de auth-node:\n${details}`);
  process.exit(1);
}

const env = parsed.data;

/** Avatar por defecto: valor directo o carpeta + nombre de archivo */
const defaultAvatarPath =
  env.CLOUDINARY_DEFAULT_AVATAR && !env.CLOUDINARY_DEFAULT_AVATAR.includes('${')
    ? env.CLOUDINARY_DEFAULT_AVATAR
    : [env.CLOUDINARY_FOLDER, env.CLOUDINARY_DEFAULT_AVATAR_FILENAME]
        .filter(Boolean)
        .join('/');

export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  port: env.PORT,
  basePath: '/api/v1',
  internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
  frontendUrl: env.FRONTEND_URL,
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    logQueries: env.DB_SQL_LOGGING,
  },
  jwt: {
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  cors: {
    allowedOrigins: env.ALLOWED_ORIGINS.length
      ? env.ALLOWED_ORIGINS
      : DEFAULT_ALLOWED_ORIGINS,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authWindowMs: env.RATE_LIMIT_AUTH_WINDOW_MS ?? env.RATE_LIMIT_WINDOW_MS,
    authMax: env.RATE_LIMIT_AUTH_MAX,
  },
  upload: {
    path: env.UPLOAD_PATH,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ] as string[],
  },
  mailProvider: env.MAIL_PROVIDER,
  kmh: {
    baseUrl: env.KMH_API_BASE_URL,
    from: env.KMH_MAIL_FROM,
    apiKey: env.KMH_PROJECT_API_KEY,
    timeoutMs: env.KMH_TIMEOUT_MS,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Sin valor explícito, SSL implícito solo en el puerto 465
    enableSsl:
      env.SMTP_ENABLE_SSL === 'true' ||
      (env.SMTP_ENABLE_SSL === undefined && env.SMTP_PORT === 465),
    username: env.SMTP_USERNAME,
    password: env.SMTP_PASSWORD,
    fromEmail: env.SMTP_FROM ?? env.EMAIL_FROM,
    fromName: env.SMTP_FROM_NAME ?? env.EMAIL_FROM_NAME,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    baseUrl: env.CLOUDINARY_BASE_URL ?? '',
    folder: env.CLOUDINARY_FOLDER ?? '',
    defaultAvatarPath,
    defaultAvatarFilename: env.CLOUDINARY_DEFAULT_AVATAR_FILENAME,
  },
} as const;

export type AppConfig = typeof config;
