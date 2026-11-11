namespace AuthService.Infrastructure.Options;

/// <summary>Sección "JwtSettings" de la configuración.</summary>
public sealed class JwtOptions
{
    public const string SectionName = "JwtSettings";

    public string? SecretKey { get; set; }
    public string Issuer { get; set; } = "AuthDotnet";
    public string Audience { get; set; } = "AuthDotnet";
    public int ExpiryInMinutes { get; set; } = 30;
}
