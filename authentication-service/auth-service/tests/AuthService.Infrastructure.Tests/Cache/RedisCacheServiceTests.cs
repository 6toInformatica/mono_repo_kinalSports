using AuthService.Application.DTOs;
using AuthService.Infrastructure.Cache;
using Microsoft.Extensions.Configuration;

namespace AuthService.Infrastructure.Tests.Cache;

public class RedisCacheServiceTests
{
    [Fact]
    public async Task GetSetRemove_WorksWithMemoryFallbackWhenRedisNotConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var cache = new RedisCacheService(config);
        var key = "kinal:user:profile:usr_1";

        Assert.Null(await cache.GetAsync<UserResponseDto>(key));

        var dto = new UserResponseDto
        {
            Id = "usr_1",
            Username = "braulio",
            Email = "braulio@ksports.local",
        };

        await cache.SetAsync(key, dto, TimeSpan.FromSeconds(60));
        var cached = await cache.GetAsync<UserResponseDto>(key);

        Assert.NotNull(cached);
        Assert.Equal("usr_1", cached.Id);
        Assert.Equal("braulio", cached.Username);

        await cache.RemoveAsync(key);
        Assert.Null(await cache.GetAsync<UserResponseDto>(key));
    }
}
