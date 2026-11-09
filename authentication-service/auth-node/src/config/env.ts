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

  // HS256 compartido con auth-service (.NET exige al menos 256 bits)
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),

  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  ALLOWED_ORIGINS: csv,

  RATE_LIMIT_WINDOW_MS: positiveInt(60_000),
  RATE_LIMIT_MAX: positiveInt(100),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_AUTH_MAX: positiveInt(30),

  UPLOAD_PATH: z.string().default('./uploads'),
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

export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  port: env.PORT,
  basePath: '/api/v1',
  internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
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
} as const;

export type AppConfig = typeof config;
