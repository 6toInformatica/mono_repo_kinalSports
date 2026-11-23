namespace AuthService.Application.Interfaces;

/// <summary>
/// Puerto de caché distribuida (Cache-Aside) compartido con los servicios de Node.js.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan ttl);
    Task RemoveAsync(string key);
}
