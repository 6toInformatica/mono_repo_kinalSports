using AuthService.Application.Interfaces;
using AuthService.Application.Services;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using NSubstitute;
using static AuthService.Application.Tests.TestData;

namespace AuthService.Application.Tests.Services;

public class RefreshTokenServiceTests
{
    private readonly IRefreshTokenRepository _repo = Substitute.For<IRefreshTokenRepository>();
    private readonly IJwtTokenService _jwt = Substitute.For<IJwtTokenService>();
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly RefreshTokenService _sut;
    private readonly Guid _family = Guid.NewGuid();

    public RefreshTokenServiceTests()
    {
        _jwt.GenerateTokenAsync(Arg.Any<string>(), Arg.Any<int>()).Returns("access-token");
        _users.GetByIdAsync(Arg.Any<string>()).Returns(AUser());
        _sut = new RefreshTokenService(_repo, _jwt, _users);
    }

    private RefreshToken Stored(string raw, DateTime? expiresAt = null, DateTime? revokedAt = null)
    {
        var token = new RefreshToken
        {
            TokenHash = RefreshTokenService.HashToken(raw),
            UserId = "usr_SeedUser0002",
            FamilyId = _family,
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(1),
            RevokedAt = revokedAt,
        };
        _repo.GetByHashAsync(token.TokenHash).Returns(token);
        return token;
    }

    [Fact]
    public void El_hash_es_sha256_en_hexadecimal_minuscula_igual_que_auth_node()
    {
        // SHA-256("abc")
        Assert.Equal(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            RefreshTokenService.HashToken("abc"));
    }

    [Fact]
    public async Task Crear_guarda_solo_el_hash_con_vigencia_de_30_dias()
    {
        var (raw, familyId) = await _sut.CreateAsync("usr_SeedUser0002");

        Assert.Equal(64, raw.Length);
        await _repo.Received(1).AddAsync(Arg.Is<RefreshToken>(t =>
            t.TokenHash == RefreshTokenService.HashToken(raw)
            && t.TokenHash != raw
            && t.FamilyId == familyId
            && t.ExpiresAt > DateTime.UtcNow.AddDays(29.9)));
    }

    [Fact]
    public async Task Rotar_revoca_el_token_usado_y_emite_otro_en_la_misma_familia()
    {
        var stored = Stored("raw");

        var result = await _sut.RotateAsync("raw");

        await _repo.Received(1).RevokeAsync(stored);
        await _repo.Received(1).AddAsync(Arg.Is<RefreshToken>(t => t.FamilyId == _family));
        Assert.Equal("access-token", result.AccessToken);
        Assert.NotEqual("raw", result.RefreshToken);
        Assert.Equal(900, result.ExpiresIn);
    }

    [Fact]
    public async Task Rotar_rechaza_un_token_desconocido()
    {
        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.RotateAsync("otro"));
        Assert.Equal("Refresh token inválido", error.Message);
    }

    [Fact]
    public async Task Rotar_revoca_y_rechaza_un_token_expirado()
    {
        var stored = Stored("raw", expiresAt: DateTime.UtcNow.AddMinutes(-1));

        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.RotateAsync("raw"));

        Assert.Equal("Refresh token expirado", error.Message);
        await _repo.Received(1).RevokeAsync(stored);
        await _repo.DidNotReceive().AddAsync(Arg.Any<RefreshToken>());
    }

    [Fact]
    public async Task Reusar_un_token_revocado_revoca_toda_la_familia()
    {
        Stored("raw", revokedAt: DateTime.UtcNow.AddMinutes(-5));

        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.RotateAsync("raw"));

        Assert.StartsWith("Sesión comprometida", error.Message);
        await _repo.Received(1).RevokeFamilyAsync(_family);
        await _repo.DidNotReceive().AddAsync(Arg.Any<RefreshToken>());
    }

    [Fact]
    public async Task Rotar_no_renueva_la_sesion_de_una_cuenta_desactivada()
    {
        Stored("raw");
        _users.GetByIdAsync(Arg.Any<string>()).Returns(AUser(status: false));

        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _sut.RotateAsync("raw"));

        Assert.Equal("La cuenta está desactivada", error.Message);
        await _repo.DidNotReceive().AddAsync(Arg.Any<RefreshToken>());
    }

    [Fact]
    public async Task Logout_solo_revoca_un_token_activo()
    {
        var active = Stored("activo");
        var revoked = Stored("revocado", revokedAt: DateTime.UtcNow);

        await _sut.RevokeAsync("activo");
        await _sut.RevokeAsync("revocado");
        await _sut.RevokeAsync("desconocido");

        await _repo.Received(1).RevokeAsync(active);
        await _repo.DidNotReceive().RevokeAsync(revoked);
    }
}
