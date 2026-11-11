using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Data;

/// <summary>
/// Contexto de la base de autenticación. Es el dueño del esquema: auth-node usa las mismas
/// tablas, pero las migraciones solo se generan y aplican desde aquí.
/// </summary>
/// <remarks>
/// Los nombres en snake_case (tablas, columnas, claves e índices) los aplica
/// UseSnakeCaseNamingConvention() al registrar el contexto (ver DependencyInjection).
/// </remarks>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User>? Users { get; set; }
    public DbSet<UserProfile>? UserProfiles { get; set; }
    public DbSet<Role>? Roles { get; set; }
    public DbSet<UserRole>? UserRoles { get; set; }
    public DbSet<UserEmail>? UserEmails { get; set; }
    public DbSet<UserPasswordReset>? UserPasswordResets { get; set; }
    public DbSet<RefreshToken>? RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var now = DateTime.UtcNow;
        var entries = ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            switch (entry.Entity)
            {
                case User user:
                    if (entry.State == EntityState.Added) user.CreatedAt = now;
                    user.UpdatedAt = now;
                    break;
                case Role role:
                    if (entry.State == EntityState.Added) role.CreatedAt = now;
                    role.UpdatedAt = now;
                    break;
                case UserRole userRole:
                    if (entry.State == EntityState.Added) userRole.CreatedAt = now;
                    userRole.UpdatedAt = now;
                    break;
            }
        }
    }
}
