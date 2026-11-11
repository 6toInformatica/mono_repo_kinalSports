using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Infrastructure.Security;

public class JwtTokenService(IOptions<JwtOptions> options, IUserRepository userRepository) : IJwtTokenService
{
    private readonly JwtOptions _settings = options.Value;

    public string GenerateToken(User user) => CreateToken(user, _settings.ExpiryInMinutes);

    public async Task<string> GenerateTokenAsync(string userId, int expiresInMinutes = 15)
    {
        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado para generación de token");

        return CreateToken(user, expiresInMinutes);
    }

    private string CreateToken(User user, int expiresInMinutes)
    {
        var secretKey = _settings.SecretKey ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Se asume un solo rol por usuario
        var role = user.UserRoles?.FirstOrDefault()?.Role?.Name ?? "USER_ROLE";

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim("role", role)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
