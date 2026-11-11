using Microsoft.AspNetCore.DataProtection;

namespace AuthService.Api.Extensions;

public static class SecurityExtensions
{
    private static readonly string[] DefaultAllowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];

    public static IServiceCollection AddSecurityPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        // CORS: solo los orígenes configurados (Security:AllowedOrigins).
        // Las apps móviles no envían Origin, así que no les afecta.
        var allowedOrigins = configuration.GetSection("Security:AllowedOrigins").Get<string[]>();
        if (allowedOrigins is null || allowedOrigins.Length == 0)
        {
            allowedOrigins = DefaultAllowedOrigins;
        }

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCorsPolicy", builder =>
            {
                builder.WithOrigins(allowedOrigins)
                       .AllowAnyHeader()
                       .AllowAnyMethod()
                       .AllowCredentials()
                       .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
            });
        });

        // Configurar Data Protection
        var keysDirectory = new DirectoryInfo("./keys");
        if (!keysDirectory.Exists)
        {
            keysDirectory.Create();
        }

        var dataProtectionBuilder = services.AddDataProtection()
                .PersistKeysToFileSystem(keysDirectory)
                .SetApplicationName("AuthDotnetApi")
                .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

        // En producción, configurar encriptación con certificado
        var environment = services.BuildServiceProvider().GetRequiredService<IWebHostEnvironment>();
        if (environment.IsProduction())
        {
            // En producción deberías usar un certificado real
            // dataProtectionBuilder.ProtectKeysWithCertificate("thumbprint");
            if (OperatingSystem.IsWindows())
            {
                dataProtectionBuilder.ProtectKeysWithDpapi();
            }
            // En Linux/macOS en producción, usar certificados o Azure Key Vault
        }
        else
        {
            // En desarrollo, usar DPAPI (solo Windows) o sin encriptación
            if (OperatingSystem.IsWindows())
            {
                dataProtectionBuilder.ProtectKeysWithDpapi();
            }
            // En Linux/macOS en desarrollo, las claves no se encriptan (solo para desarrollo)
        }

        // Configurar Antiforgery (CSRF Protection)
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.SuppressXFrameOptionsHeader = false;
            options.Cookie.Name = "__RequestVerificationToken";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Strict;
        });

        return services;
    }

    public static IServiceCollection AddSecurityOptions(this IServiceCollection services)
    {
        services.Configure<CookiePolicyOptions>(options =>
        {
            options.CheckConsentNeeded = context => true;
            options.MinimumSameSitePolicy = SameSiteMode.Strict;
            options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
            options.Secure = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }
}

