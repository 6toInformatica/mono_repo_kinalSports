import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../../config/env.ts';
import { PrismaClient } from '../../generated/prisma/client.ts';

export type { PrismaClient } from '../../generated/prisma/client.ts';
export { Prisma } from '../../generated/prisma/client.ts';

/**
 * Cliente de PostgreSQL. El esquema pertenece a las migraciones de EF Core
 * (auth-service); Prisma solo lee y escribe datos, nunca migra.
 */
const { database } = config;

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 30_000,
  }),
  log: database.logQueries ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

/** Transacción interactiva (cliente que reciben los repositorios dentro de ella) */
export type DbClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

export const connectDatabase = async () => {
  console.log('PostgreSQL | Trying to connect...');
  await prisma.$queryRaw`SELECT 1`;
  console.log('PostgreSQL | Connected to PostgreSQL');
};

export const closeDatabase = async () => {
  await prisma.$disconnect();
  console.log('PostgreSQL | Database connection closed successfully');
};
