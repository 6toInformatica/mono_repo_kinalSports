using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuthService.Persistence.Migrations
{
    /// <summary>
    /// Lleva al esquema canónico (InitialSchema) una base creada antes de que EF Core fuera
    /// el dueño del esquema: por Sequelize (auth-node) o por EnsureCreated (versiones anteriores).
    /// </summary>
    /// <remarks>
    /// Es idempotente: sobre una base creada por InitialSchema no cambia nada.
    /// No borra ni modifica datos, salvo convertir profile_picture nulo en cadena vacía.
    /// </remarks>
    public partial class AlignLegacySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // refresh_tokens no existía en algunas bases antiguas
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id uuid NOT NULL,
                    token_hash character varying(255) NOT NULL,
                    user_id character varying(16) NOT NULL,
                    family_id uuid NOT NULL,
                    expires_at timestamp with time zone NOT NULL,
                    revoked_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL,
                    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id)
                );
                """);

            // 1. Renombra claves primarias y elimina claves foráneas, restricciones únicas e
            //    índices que no tengan el nombre canónico (se recrean en los pasos siguientes)
            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    r record;
                    auth_tables text[] := ARRAY['users', 'user_profiles', 'user_emails',
                        'user_password_resets', 'roles', 'user_roles', 'refresh_tokens'];
                    canonical_fks text[] := ARRAY['fk_user_profiles_users_user_id',
                        'fk_user_emails_users_user_id', 'fk_user_password_resets_users_user_id',
                        'fk_user_roles_users_user_id', 'fk_user_roles_roles_role_id',
                        'fk_refresh_tokens_users_user_id'];
                    canonical_indexes text[] := ARRAY['ix_users_email', 'ix_users_username',
                        'ix_roles_name', 'ix_user_profiles_user_id', 'ix_user_emails_user_id',
                        'ix_user_password_resets_user_id', 'ix_user_roles_user_id',
                        'ix_user_roles_role_id', 'ix_refresh_tokens_token_hash',
                        'ix_refresh_tokens_family_id', 'ix_refresh_tokens_user_id'];
                BEGIN
                    FOR r IN
                        SELECT c.conname, t.relname
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE n.nspname = current_schema()
                          AND c.contype = 'p'
                          AND t.relname = ANY (auth_tables)
                          AND c.conname <> 'pk_' || t.relname
                    LOOP
                        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
                            r.relname, r.conname, 'pk_' || r.relname);
                    END LOOP;

                    FOR r IN
                        SELECT c.conname, t.relname
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE n.nspname = current_schema()
                          AND c.contype IN ('f', 'u')
                          AND t.relname = ANY (auth_tables)
                          AND NOT (c.conname = ANY (canonical_fks))
                    LOOP
                        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.relname, r.conname);
                    END LOOP;

                    FOR r IN
                        SELECT i.relname AS index_name
                        FROM pg_index x
                        JOIN pg_class i ON i.oid = x.indexrelid
                        JOIN pg_class t ON t.oid = x.indrelid
                        JOIN pg_namespace n ON n.oid = t.relnamespace
                        WHERE n.nspname = current_schema()
                          AND NOT x.indisprimary
                          AND t.relname = ANY (auth_tables)
                          AND NOT (i.relname = ANY (canonical_indexes))
                          AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = x.indexrelid)
                    LOOP
                        EXECUTE format('DROP INDEX %I', r.index_name);
                    END LOOP;
                END $$;
                """);

            // 2. Tipos, nulabilidad y valores por defecto canónicos
            migrationBuilder.Sql("""
                UPDATE user_profiles SET profile_picture = '' WHERE profile_picture IS NULL;

                ALTER TABLE user_profiles
                    ALTER COLUMN user_id SET NOT NULL,
                    ALTER COLUMN profile_picture TYPE character varying(512),
                    ALTER COLUMN profile_picture SET DEFAULT '',
                    ALTER COLUMN profile_picture SET NOT NULL;
                ALTER TABLE user_emails ALTER COLUMN user_id SET NOT NULL;
                ALTER TABLE user_password_resets ALTER COLUMN user_id SET NOT NULL;
                ALTER TABLE user_roles
                    ALTER COLUMN user_id SET NOT NULL,
                    ALTER COLUMN role_id SET NOT NULL;
                ALTER TABLE roles ALTER COLUMN name TYPE character varying(50);
                ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE character varying(255);
                """);

            // 3. Índices canónicos
            migrationBuilder.Sql("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_roles_name ON roles (name);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_user_profiles_user_id ON user_profiles (user_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_user_emails_user_id ON user_emails (user_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_user_password_resets_user_id ON user_password_resets (user_id);
                CREATE INDEX IF NOT EXISTS ix_user_roles_user_id ON user_roles (user_id);
                CREATE INDEX IF NOT EXISTS ix_user_roles_role_id ON user_roles (role_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens (token_hash);
                CREATE INDEX IF NOT EXISTS ix_refresh_tokens_family_id ON refresh_tokens (family_id);
                CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);
                """);

            // 4. Claves foráneas canónicas
            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    fk record;
                BEGIN
                    FOR fk IN
                        SELECT * FROM (VALUES
                            ('user_profiles', 'fk_user_profiles_users_user_id', 'user_id', 'users', 'CASCADE'),
                            ('user_emails', 'fk_user_emails_users_user_id', 'user_id', 'users', 'CASCADE'),
                            ('user_password_resets', 'fk_user_password_resets_users_user_id', 'user_id', 'users', 'CASCADE'),
                            ('user_roles', 'fk_user_roles_users_user_id', 'user_id', 'users', 'CASCADE'),
                            ('user_roles', 'fk_user_roles_roles_role_id', 'role_id', 'roles', 'RESTRICT'),
                            ('refresh_tokens', 'fk_refresh_tokens_users_user_id', 'user_id', 'users', 'CASCADE')
                        ) AS v(table_name, constraint_name, column_name, referenced_table, on_delete)
                    LOOP
                        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = fk.constraint_name) THEN
                            EXECUTE format(
                                'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I (id) ON DELETE %s',
                                fk.table_name, fk.constraint_name, fk.column_name, fk.referenced_table, fk.on_delete);
                        END IF;
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Sin reversa: el esquema anterior era el estado inconsistente que esta migración corrige
        }
    }
}
