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

/**
 * Esquema canónico de PostgreSQL (idéntico a InitialSchema de EF Core).
 * Si auth-migrator (.NET) ya corrió, no hace nada; en producción (donde no se
 * despliega .NET) inicializa las tablas automáticamente al arrancar auth-node.
 */
const CANONICAL_SCHEMA_SQL = `
DO $$
BEGIN
  IF to_regclass('users') IS NULL THEN
    CREATE TABLE roles (
      id character varying(16) NOT NULL,
      name character varying(50) NOT NULL,
      created_at timestamp with time zone NOT NULL,
      updated_at timestamp with time zone NOT NULL,
      CONSTRAINT pk_roles PRIMARY KEY (id)
    );

    CREATE TABLE users (
      id character varying(16) NOT NULL,
      name character varying(25) NOT NULL,
      surname character varying(25) NOT NULL,
      username character varying(50) NOT NULL,
      email character varying(150) NOT NULL,
      password character varying(255) NOT NULL,
      status boolean NOT NULL DEFAULT false,
      deleted_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL,
      updated_at timestamp with time zone NOT NULL,
      CONSTRAINT pk_users PRIMARY KEY (id)
    );

    CREATE TABLE refresh_tokens (
      id uuid NOT NULL,
      token_hash character varying(255) NOT NULL,
      user_id character varying(16) NOT NULL,
      family_id uuid NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      revoked_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL,
      CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
      CONSTRAINT fk_refresh_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE user_emails (
      id character varying(16) NOT NULL,
      user_id character varying(16) NOT NULL,
      email_verified boolean NOT NULL DEFAULT false,
      email_verification_token character varying(256),
      email_verification_token_expiry timestamp with time zone,
      CONSTRAINT pk_user_emails PRIMARY KEY (id),
      CONSTRAINT fk_user_emails_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE user_password_resets (
      id character varying(16) NOT NULL,
      user_id character varying(16) NOT NULL,
      password_reset_token character varying(256),
      password_reset_token_expiry timestamp with time zone,
      CONSTRAINT pk_user_password_resets PRIMARY KEY (id),
      CONSTRAINT fk_user_password_resets_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE user_profiles (
      id character varying(16) NOT NULL,
      user_id character varying(16) NOT NULL,
      profile_picture character varying(512) NOT NULL DEFAULT '',
      phone character varying(8) NOT NULL,
      CONSTRAINT pk_user_profiles PRIMARY KEY (id),
      CONSTRAINT fk_user_profiles_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE user_roles (
      id character varying(16) NOT NULL,
      user_id character varying(16) NOT NULL,
      role_id character varying(16) NOT NULL,
      created_at timestamp with time zone NOT NULL,
      updated_at timestamp with time zone NOT NULL,
      CONSTRAINT pk_user_roles PRIMARY KEY (id),
      CONSTRAINT fk_user_roles_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
      CONSTRAINT fk_user_roles_users_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX ix_roles_name ON roles (name);
    CREATE UNIQUE INDEX ix_users_email ON users (email);
    CREATE UNIQUE INDEX ix_users_username ON users (username);
    CREATE INDEX ix_refresh_tokens_family_id ON refresh_tokens (family_id);
    CREATE UNIQUE INDEX ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);
    CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
    CREATE UNIQUE INDEX ix_user_emails_user_id ON user_emails (user_id);
    CREATE UNIQUE INDEX ix_user_password_resets_user_id ON user_password_resets (user_id);
    CREATE UNIQUE INDEX ix_user_profiles_user_id ON user_profiles (user_id);
    CREATE INDEX ix_user_roles_role_id ON user_roles (role_id);
    CREATE INDEX ix_user_roles_user_id ON user_roles (user_id);
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
ALTER TABLE roles DROP COLUMN IF EXISTS label;
ALTER TABLE roles DROP COLUMN IF EXISTS deleted_at;
`;

export const connectDatabase = async () => {
  console.log('PostgreSQL | Trying to connect...');
  await prisma.$queryRaw`SELECT 1`;
  await prisma.$executeRawUnsafe(CANONICAL_SCHEMA_SQL);
  console.log('PostgreSQL | Connected to PostgreSQL');
};

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export const closeDatabase = async () => {
  await prisma.$disconnect();
  console.log('PostgreSQL | Database connection closed successfully');
};
