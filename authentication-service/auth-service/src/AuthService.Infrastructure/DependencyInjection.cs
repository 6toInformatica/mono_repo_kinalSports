using AuthService.Application.Interfaces;
using AuthService.Infrastructure.Email;
using AuthService.Infrastructure.Options;
using AuthService.Infrastructure.Security;
using AuthService.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuthService.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registra los adaptadores a servicios externos y sus opciones.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<AppOptions>(configuration.GetSection(AppOptions.SectionName));
        services.Configure<CloudinaryOptions>(configuration.GetSection(CloudinaryOptions.SectionName));

        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        // Correo: Kinal Mail Hub (API REST) por defecto; SMTP para las pruebas con Mailpit
        services.Configure<KinalMailHubOptions>(configuration.GetSection(KinalMailHubOptions.SectionName));
        var emailProvider = configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>()?.Provider ?? "kmh";
        if (string.Equals(emailProvider, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            services.AddScoped<IEmailService, EmailService>();
        }
        else
        {
            var timeout = configuration.GetSection(KinalMailHubOptions.SectionName).Get<KinalMailHubOptions>()?.TimeoutSeconds ?? 10;
            services.AddHttpClient<IEmailService, KinalMailHubEmailService>(client =>
                client.Timeout = TimeSpan.FromSeconds(timeout));
        }

        return services;
    }
}
