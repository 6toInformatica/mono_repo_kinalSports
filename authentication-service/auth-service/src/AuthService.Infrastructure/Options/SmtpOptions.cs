namespace AuthService.Infrastructure.Options;

/// <summary>Sección "SmtpSettings" de la configuración.</summary>
public sealed class SmtpOptions
{
    public const string SectionName = "SmtpSettings";

    public bool Enabled { get; set; } = true;
    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
    public bool UseImplicitSsl { get; set; }
    public int Timeout { get; set; } = 30000;
    public bool UseFallback { get; set; }
}
