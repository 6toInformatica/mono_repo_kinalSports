using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;

namespace AuthService.Application.Tests;

/// <summary>Datos de ejemplo reutilizables en las pruebas.</summary>
internal static class TestData
{
    public static User AUser(bool status = true, bool verified = true, string role = "USER_ROLE") => new()
    {
        Id = "usr_SeedUser0002",
        Name = "Andrea",
        Surname = "Morales",
        Username = "andrea.morales",
        Email = "andrea.morales@kinalsports.gt",
        Password = "hash",
        Status = status,
        UserProfile = new UserProfile { Id = "p1", UserId = "usr_SeedUser0002", ProfilePicture = "avatar.png", Phone = "42178935" },
        UserEmail = new UserEmail { Id = "e1", UserId = "usr_SeedUser0002", EmailVerified = verified },
        UserPasswordReset = new UserPasswordReset { Id = "r1", UserId = "usr_SeedUser0002" },
        UserRoles = [new UserRole { Id = "ur1", UserId = "usr_SeedUser0002", RoleId = "rol1", Role = new Role { Id = "rol1", Name = role } }],
    };

    public sealed record FakeFile(string FileName, string ContentType, long Size) : IFileData
    {
        public byte[] Data { get; } = [1, 2, 3];
    }
}
