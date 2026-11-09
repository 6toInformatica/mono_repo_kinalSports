namespace AuthService.Infrastructure.Options;

/// <summary>Sección "AppSettings" de la configuración.</summary>
public sealed class AppOptions
{
    public const string SectionName = "AppSettings";

    /// <summary>URL del frontend usada en los enlaces de los correos.</summary>
    public string? FrontendUrl { get; set; }
}
