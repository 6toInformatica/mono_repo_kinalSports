using AuthService.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AuthService.Persistence.Data;

/// <summary>
/// Prepara la base de autenticación: aplica las migraciones de EF Core y siembra los datos iniciales.
/// </summary>
public static class DatabaseInitializer
{
    /// <summary>Migración que crea el esquema completo desde cero.</summary>
    public const string BaselineMigrationId = "20261109153956_InitialSchema";

    // Valores sustituidos: constantes internas, nunca datos de usuario
    private const string BaselineSqlTemplate = """
        DO $$
        BEGIN
            IF to_regclass('users') IS NOT NULL THEN
                CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                    migration_id character varying(150) NOT NULL,
                    product_version character varying(32) NOT NULL,
                    CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id)
                );
                INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
                VALUES ('{migration}', '{version}')
                ON CONFLICT (migration_id) DO NOTHING;
            END IF;
        END $$;
        """;

    public static async Task InitializeAsync(
        ApplicationDbContext context,
        IPasswordHashService passwordHasher,
        string? adminPassword,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        await BaselineExistingDatabaseAsync(context, logger, cancellationToken);

        var pending = (await context.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
        if (pending.Count > 0)
        {
            logger.LogInformation("Applying {Count} database migration(s): {Migrations}", pending.Count, string.Join(", ", pending));
        }
        await context.Database.MigrateAsync(cancellationToken);

        await DataSeeder.SeedAsync(context, passwordHasher, adminPassword, logger);
    }

    /// <summary>
    /// Una base creada antes de usar migraciones (por Sequelize o por EnsureCreated) ya tiene las
    /// tablas pero no el historial. Se marca la migración inicial como aplicada para que
    /// MigrateAsync no intente crearlas de nuevo; AlignLegacySchema completa el resto.
    /// </summary>
    private static async Task BaselineExistingDatabaseAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var productVersion = typeof(DbContext).Assembly.GetName().Version?.ToString(3) ?? "10.0.0";

        // Si la tabla users existe, la migración inicial ya está reflejada en la base
        // (creada por ella misma o por una versión anterior). ON CONFLICT la hace idempotente.
        var sql = BaselineSqlTemplate
            .Replace("{migration}", BaselineMigrationId)
            .Replace("{version}", productVersion);
        await context.Database.ExecuteSqlRawAsync(sql, cancellationToken);

        logger.LogInformation("Database baseline check completed");
    }
}
