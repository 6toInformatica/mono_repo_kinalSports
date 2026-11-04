using System.Security.Cryptography;
using System.Text;
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IUserRepository _userRepository;
    public RefreshTokenService(IRefreshTokenRepository refreshTokenRepository, IJwtTokenService jwtTokenService, IUserRepository userRepository)
    {
        _refreshTokenRepository = refreshTokenRepository;
        _jwtTokenService = jwtTokenService;
        _userRepository = userRepository;
    }

    public async Task RevokeAllForUserAsync(string userId)
    {
        await _refreshTokenRepository.RevokeAllForUserAsync(userId);
        await _refreshTokenRepository.SaveChangesAsync();
    }

    public static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLower();
    }

    public async Task<(string rawToken, Guid familyId)> CreateAsync(string userId, Guid? familyId = null)
    {
        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLower();
        var hash = HashToken(raw);
        var famId = familyId ?? Guid.NewGuid();
        var expiresAt = DateTime.UtcNow.AddDays(30);
        var token = new RefreshToken
        {
            TokenHash = hash,
            UserId = userId,
            FamilyId = famId,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
        await _refreshTokenRepository.AddAsync(token);
        await _refreshTokenRepository.SaveChangesAsync();
        return (raw, famId);
    }

    public async Task<RefreshResponseDto> RotateAsync(string rawToken)
    {
        var hash = HashToken(rawToken);
        var token = await _refreshTokenRepository.GetByHashAsync(hash);
        if (token == null)
            throw new UnauthorizedAccessException("Refresh token inválido");
        if (token.IsExpired)
        {
            await _refreshTokenRepository.RevokeAsync(token);
            await _refreshTokenRepository.SaveChangesAsync();
            throw new UnauthorizedAccessException("Refresh token expirado");
        }
        if (token.IsRevoked)
        {
            await _refreshTokenRepository.RevokeFamilyAsync(token.FamilyId);
            await _refreshTokenRepository.SaveChangesAsync();
            throw new UnauthorizedAccessException("Sesión comprometida. Refresh token reutilizado.");
        }
        await _refreshTokenRepository.RevokeAsync(token);
        await _refreshTokenRepository.SaveChangesAsync();

        // Un usuario desactivado no puede seguir renovando su sesión
        var user = await _userRepository.GetByIdAsync(token.UserId);
        if (!user.Status)
            throw new UnauthorizedAccessException("La cuenta está desactivada");

        var (newRaw, famId) = await CreateAsync(token.UserId, token.FamilyId);
        var accessToken = await _jwtTokenService.GenerateTokenAsync(token.UserId, expiresInMinutes: 15);
        return new RefreshResponseDto(accessToken, newRaw, 900);
    }

    public async Task RevokeAsync(string rawToken)
    {
        var hash = HashToken(rawToken);
        var token = await _refreshTokenRepository.GetByHashAsync(hash);
        if (token != null && !token.IsRevoked)
        {
            await _refreshTokenRepository.RevokeAsync(token);
            await _refreshTokenRepository.SaveChangesAsync();
        }
    }
}
