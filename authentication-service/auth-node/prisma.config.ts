import { defineConfig } from 'prisma/config';

// El esquema lo crean y migran solo las migraciones de EF Core (auth-service).
// Prisma únicamente lo lee: `prisma db pull` para actualizar schema.prisma
// y `prisma generate` para el cliente. Nunca se ejecuta `prisma migrate`.
const databaseUrl =
  process.env.DATABASE_URL ??
  `postgresql://${encodeURIComponent(process.env.DB_USERNAME ?? '')}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? ''}`;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: { url: databaseUrl },
});
