using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Persistence.Configurations;

// Tablas 1:1 con users: perfil, correo y restablecimiento de contraseña.
// La relación (FK única y borrado en cascada) se define en UserConfiguration.

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> entity)
    {
        entity.ToTable("user_profiles");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.UserId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.ProfilePicture).IsRequired().HasMaxLength(512).HasDefaultValue("");
        entity.Property(e => e.Phone).IsRequired().HasMaxLength(8);
    }
}

public class UserEmailConfiguration : IEntityTypeConfiguration<UserEmail>
{
    public void Configure(EntityTypeBuilder<UserEmail> entity)
    {
        entity.ToTable("user_emails");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.UserId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.EmailVerified).HasDefaultValue(false);
        entity.Property(e => e.EmailVerificationToken).HasMaxLength(256);
    }
}

public class UserPasswordResetConfiguration : IEntityTypeConfiguration<UserPasswordReset>
{
    public void Configure(EntityTypeBuilder<UserPasswordReset> entity)
    {
        entity.ToTable("user_password_resets");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.UserId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.PasswordResetToken).HasMaxLength(256);
    }
}
