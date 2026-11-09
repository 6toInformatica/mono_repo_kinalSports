using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> entity)
    {
        entity.ToTable("refresh_tokens");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).ValueGeneratedNever();
        // Hash SHA-256 en hexadecimal (64 caracteres)
        entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(255);
        entity.Property(e => e.UserId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.FamilyId).IsRequired();
        entity.Property(e => e.ExpiresAt).IsRequired();
        entity.Property(e => e.CreatedAt).IsRequired();

        // Propiedades calculadas en memoria, no son columnas
        entity.Ignore(e => e.IsExpired);
        entity.Ignore(e => e.IsRevoked);
        entity.Ignore(e => e.IsActive);

        entity.HasIndex(e => e.TokenHash).IsUnique();
        entity.HasIndex(e => e.FamilyId);

        entity.HasOne(e => e.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
