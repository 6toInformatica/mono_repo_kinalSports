using AuthService.Application;
using AuthService.Infrastructure;
using AuthService.Persistence;

namespace AuthService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>Compone las capas de la aplicación (Clean Architecture).</summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddApplication()
            .AddInfrastructure(configuration)
            .AddPersistence(configuration);

        services.AddHealthChecks();

        return services;
    }

    public static IServiceCollection AddApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
