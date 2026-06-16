using System;
using System.Threading.RateLimiting;

namespace AuthService.Api.Extensions;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddRateLimitingPolicies(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var rateLimiting = configuration.GetSection("RateLimiting");
        var authPermitLimit = rateLimiting.GetValue("AuthPermitLimit", 30);
        var authWindowMinutes = rateLimiting.GetValue("AuthWindowMinutes", 1);
        var apiTokenLimit = rateLimiting.GetValue("ApiTokenLimit", 200);
        var apiTokensPerPeriod = rateLimiting.GetValue("ApiTokensPerPeriod", 100);
        var apiReplenishmentMinutes = rateLimiting.GetValue("ApiReplenishmentMinutes", 1);

        services.AddRateLimiter(options =>
        {
            // Rate limiting para autenticación
            options.AddPolicy("AuthPolicy", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = authPermitLimit,
                        Window = TimeSpan.FromMinutes(authWindowMinutes)
                    }));

            // Rate limiting general para API
            options.AddPolicy("ApiPolicy", context =>
                RateLimitPartition.GetTokenBucketLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new TokenBucketRateLimiterOptions
                    {
                        TokenLimit = apiTokenLimit,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5,
                        ReplenishmentPeriod = TimeSpan.FromMinutes(apiReplenishmentMinutes),
                        TokensPerPeriod = apiTokensPerPeriod,
                        AutoReplenishment = true
                    }));

            // Respuesta cuando se excede el límite
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsync("Too Many Requests. Please try again later.", token);
            };
        });

        return services;
    }
}
