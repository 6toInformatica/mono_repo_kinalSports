namespace AuthService.Infrastructure.Options;

/// <summary>Sección "KinalMailHub": gateway REST de correo del colegio.</summary>
public sealed class KinalMailHubOptions
{
    public const string SectionName = "KinalMailHub";

    public string BaseUrl { get; set; } = "https://mail.lab.kinal.edu.gt";
    public string From { get; set; } = "kinal-sports@am-delta.in6am.mail.kinal.test";
    public string? ApiKey { get; set; }
    public int TimeoutSeconds { get; set; } = 10;
}

/// <summary>Sección "Email": qué transporte usar ("kmh" o "smtp").</summary>
public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string Provider { get; set; } = "kmh";
}
