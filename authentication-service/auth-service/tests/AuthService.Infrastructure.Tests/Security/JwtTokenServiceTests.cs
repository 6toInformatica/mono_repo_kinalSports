using System.IdentityModel.Tokens.Jwt;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Options;
using AuthService.Infrastructure.Security;
using NSubstitute;
using MsOptions = Microsoft.Extensions.Options.Options;

namespace AuthService.Infrastructure.Tests.Security;

public class JwtTokenServiceTests
{
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();

    private JwtTokenService Create(string? secret = "una-clave-de-prueba-de-al-menos-256-bits!!") =>
        new(MsOptions.Create(new JwtOptions { SecretKey = secret, Issuer = "AuthService", Audience = "AuthService" }), _users);

    private static User AnAdmin() => new()
    {
        Id = "usr_SeedUser0001",
        UserRoles = [new UserRole { Role = new Role { Name = "ADMIN_ROLE" } }],
    };

    [Fact]
    public async Task Incluye_los_claims_que_esperan_auth_node_y_los_servidores()
    {
        _users.GetByIdAsync("usr_SeedUser0001").Returns(AnAdmin());

        var raw = await Create().GenerateTokenAsync("usr_SeedUser0001", expiresInMinutes: 15);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(raw);

        Assert.Equal("HS256", token.Header.Alg);
        Assert.Equal("usr_SeedUser0001", token.Subject);
        Assert.Equal("ADMIN_ROLE", token.Claims.Single(c => c.Type == "role").Value);
        Assert.Contains(token.Claims, c => c.Type == JwtRegisteredClaimNames.Jti);
        Assert.Contains(token.Claims, c => c.Type == JwtRegisteredClaimNames.Iat);
        Assert.Equal("AuthService", token.Issuer);
        Assert.InRange(token.ValidTo, DateTime.UtcNow.AddMinutes(14), DateTime.UtcNow.AddMinutes(16));
    }

    [Fact]
    public void Usa_USER_ROLE_si_el_usuario_no_tiene_rol()
    {
        var raw = Create().GenerateToken(new User { Id = "u1" });
        var token = new JwtSecurityTokenHandler().ReadJwtToken(raw);

        Assert.Equal("USER_ROLE", token.Claims.Single(c => c.Type == "role").Value);
    }

    [Fact]
    public async Task Falla_si_el_usuario_no_existe()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => Create().GenerateTokenAsync("nadie"));
    }

    [Fact]
    public void Falla_sin_clave_secreta()
    {
        Assert.Throws<InvalidOperationException>(() => Create(secret: null).GenerateToken(AnAdmin()));
    }
}
