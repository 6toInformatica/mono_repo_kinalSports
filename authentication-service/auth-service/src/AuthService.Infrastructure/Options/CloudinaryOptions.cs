namespace AuthService.Infrastructure.Options;

/// <summary>Sección "CloudinarySettings" de la configuración.</summary>
/// <remarks>
/// Los valores sin configurar quedan en null: cada uso aplica su propio valor por defecto,
/// igual que antes de introducir las opciones tipadas.
/// </remarks>
public sealed class CloudinaryOptions
{
    public const string SectionName = "CloudinarySettings";

    public string? CloudName { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiSecret { get; set; }
    public string? BaseUrl { get; set; }
    public string? Folder { get; set; }
    public string? DefaultAvatarPath { get; set; }
}
