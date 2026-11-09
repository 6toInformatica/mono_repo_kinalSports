using AuthService.Api.Extensions;
using AuthService.Api.Middlewares;
using AuthService.Api.ModelBinders;
using AuthService.Persistence.Data;
using NetEscapades.AspNetCore.SecurityHeaders.Infrastructure;
using Serilog;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog from appsettings.json only (avoid duplicate sinks)
builder.Host.UseSerilog((context, services, loggerConfiguration) =>
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services));

// Add services to the container
builder.Services.AddControllers(options =>
{
    // Agregar el model binder para IFileData
    options.ModelBinderProviders.Insert(0, new FileDataModelBinderProvider());
})
.AddJsonOptions(o =>
{
    // Estandarizar las respuestas en camelCase para coincidir con auth-node
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Configure services through extension methods
builder.Services.AddApiDocumentation();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddRateLimitingPolicies(builder.Configuration);

// Add security services
builder.Services.AddSecurityPolicies(builder.Configuration);
builder.Services.AddSecurityOptions();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add Serilog request logging
app.UseSerilogRequestLogging();

// Add Security Headers using NetEscapades package
app.UseSecurityHeaders(policies => policies
    .AddDefaultSecurityHeaders()
    .RemoveServerHeader()
    .AddFrameOptionsDeny()
    .AddXssProtectionBlock()
    .AddContentTypeOptionsNoSniff()
    .AddReferrerPolicyStrictOriginWhenCrossOrigin()
    .AddContentSecurityPolicy(builder =>
    {
        builder.AddDefaultSrc().Self();
        builder.AddScriptSrc().Self().UnsafeInline();
        builder.AddStyleSrc().Self().UnsafeInline();
        builder.AddImgSrc().Self().Data();
        builder.AddFontSrc().Self().Data();
        builder.AddConnectSrc().Self();
        builder.AddFrameAncestors().None();
        builder.AddBaseUri().Self();
        builder.AddFormAction().Self();
    })
    .AddCustomHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
    .AddCustomHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
);

// Global exception handling
app.UseMiddleware<GlobalExceptionMiddleware>();

// Core middlewares
// app.UseHttpsRedirection();
app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoints - both versions for compatibility
// Standard health check endpoint
app.MapHealthChecks("/health");

// Custom health endpoint to match Node.js response format
app.MapGet("/health", () =>
{
    var response = new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    };
    return Results.Ok(response);
});

app.MapHealthChecks("/api/v1/health");

// Startup log: addresses and health endpoint
var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
app.Lifetime.ApplicationStarted.Register(() =>
{
    try
    {
        var server = app.Services.GetRequiredService<IServer>();
        var addressesFeature = server.Features.Get<IServerAddressesFeature>();
        var addresses = (IEnumerable<string>?)addressesFeature?.Addresses ?? app.Urls;

        if (addresses != null && addresses.Any())
        {
            foreach (var addr in addresses)
            {
                var health = $"{addr.TrimEnd('/')}/health";
                startupLogger.LogInformation("AuthService API is running at {Url}. Health endpoint: {HealthUrl}", addr, health);
            }
        }
        else
        {
            startupLogger.LogInformation("AuthService API started. Health endpoint: /health");
        }
    }
    catch (Exception ex)
    {
        startupLogger.LogWarning(ex, "Failed to determine the listening addresses for startup log");
    }
});

// Migraciones y datos iniciales. EF Core es el único dueño del esquema (auth-node lo comparte).
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<AuthService.Application.Interfaces.IPasswordHashService>();

    try
    {
        logger.LogInformation("Initializing database...");
        await DatabaseInitializer.InitializeAsync(context, passwordHasher, logger);
        logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
        throw; // Detiene la aplicación
    }
}

// Modo migrador (servicio auth-migrator de docker-compose): prepara la base y termina
if (args.Contains("--migrate-only"))
{
    return;
}

app.Run();
