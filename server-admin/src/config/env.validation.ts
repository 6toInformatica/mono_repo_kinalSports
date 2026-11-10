import { z } from 'zod';

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

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3009),
  URI_MONGODB: z.string().min(1),
  // HS256 compartido con los servicios de auth (.NET exige al menos 256 bits)
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
  AUTH_SERVICE_URL: z.string().optional(),
  // Orígenes web del panel admin (separados por coma)
  ADMIN_ALLOWED_ORIGINS: csv,
});

export type Env = z.infer<typeof envSchema>;

/** Validación de ConfigModule: si falta algo obligatorio, el servicio no arranca */
export const validateEnv = (raw: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración inválida de server-admin:\n${details}`);
  }
  return parsed.data;
};

/** Orígenes configurados o, si no hay, los de desarrollo (3000, 3001 y 5173) */
export const allowedOrigins = (configured: string[]) =>
  configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
