// Orígenes web permitidos (ALLOWED_ORIGINS, separados por coma). Mismos valores por
// defecto que los servicios de auth. La app móvil no envía Origin, así que no le afecta.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: configuredOrigins.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
