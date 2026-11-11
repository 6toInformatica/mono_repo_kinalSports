using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AuthService.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> entity)
    {
        entity.ToTable("roles");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
        entity.Property(e => e.CreatedAt).IsRequired();
        entity.Property(e => e.UpdatedAt).IsRequired();

        // Evita roles duplicados aunque los dos servicios de auth siembren a la vez
        entity.HasIndex(e => e.Name).IsUnique();
    }
}

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> entity)
    {
        entity.ToTable("user_roles");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id).HasMaxLength(16).ValueGeneratedNever();
        entity.Property(e => e.UserId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.RoleId).IsRequired().HasMaxLength(16);
        entity.Property(e => e.CreatedAt).IsRequired();
        entity.Property(e => e.UpdatedAt).IsRequired();

        entity.HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Un rol asignado a usuarios no se puede eliminar
        entity.HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
