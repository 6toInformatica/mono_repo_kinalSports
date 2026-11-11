using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> entity)
    {
        entity.ToTable("users");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.Name).IsRequired().HasMaxLength(25);
        entity.Property(e => e.Surname).IsRequired().HasMaxLength(25);
        entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
        entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
        entity.Property(e => e.Password).IsRequired().HasMaxLength(255);
        entity.Property(e => e.Status).HasDefaultValue(false);
        entity.Property(e => e.CreatedAt).IsRequired();
        entity.Property(e => e.UpdatedAt).IsRequired();

        entity.HasIndex(e => e.Username).IsUnique();
        entity.HasIndex(e => e.Email).IsUnique();

        // Datos 1:1 del usuario: se eliminan junto con él
        entity.HasOne(e => e.UserProfile)
            .WithOne(p => p.User)
            .HasForeignKey<UserProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.UserEmail)
            .WithOne(ue => ue.User)
            .HasForeignKey<UserEmail>(ue => ue.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.UserPasswordReset)
            .WithOne(upr => upr.User)
            .HasForeignKey<UserPasswordReset>(upr => upr.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
