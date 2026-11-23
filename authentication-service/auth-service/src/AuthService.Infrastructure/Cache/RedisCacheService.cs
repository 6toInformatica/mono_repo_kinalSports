using System.Collections.Concurrent;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using AuthService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AuthService.Infrastructure.Cache;

/// <summary>
/// Adaptador de caché Cache-Aside respaldado en Redis (protocolo RESP2 por TCP)
/// con degradación elegante a memoria local cuando REDIS_URL no está configurado.
/// Comparte las llaves `kinal:user:profile:{userId}` con auth-node, server-admin y server-user.
/// </summary>
public sealed class RedisCacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    private readonly string? _host;
    private readonly int _port;
    private readonly ConcurrentDictionary<string, (string Raw, DateTimeOffset ExpiresAt)> _memory = new();

    public RedisCacheService(IConfiguration configuration)
    {
        var redisUrl = configuration["Redis:ConnectionString"]
            ?? configuration["REDIS_URL"]
            ?? Environment.GetEnvironmentVariable("REDIS_URL");

        if (!string.IsNullOrWhiteSpace(redisUrl))
        {
            if (Uri.TryCreate(redisUrl, UriKind.Absolute, out var uri) && !string.IsNullOrEmpty(uri.Host))
            {
                _host = uri.Host;
                _port = uri.Port > 0 ? uri.Port : 6379;
            }
            else
            {
                var parts = redisUrl.Split(':', 2);
                _host = parts[0];
                _port = parts.Length > 1 && int.TryParse(parts[1], out var p) ? p : 6379;
            }
        }
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (!string.IsNullOrEmpty(_host))
        {
            try
            {
                var raw = await ExecuteCommandAsync("GET", key).ConfigureAwait(false);
                if (raw is not null)
                {
                    _memory[key] = (raw, DateTimeOffset.UtcNow.AddSeconds(30));
                    return JsonSerializer.Deserialize<T>(raw, JsonOptions);
                }

                _memory.TryRemove(key, out _);
                return default;
            }
            catch
            {
                // Degradación elegante a memoria si Redis no responde
            }
        }

        if (_memory.TryGetValue(key, out var entry))
        {
            if (entry.ExpiresAt > DateTimeOffset.UtcNow)
            {
                return JsonSerializer.Deserialize<T>(entry.Raw, JsonOptions);
            }

            _memory.TryRemove(key, out _);
        }

        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        var seconds = Math.Max(1, (int)ttl.TotalSeconds);
        var raw = JsonSerializer.Serialize(value, JsonOptions);
        _memory[key] = (raw, DateTimeOffset.UtcNow.AddSeconds(seconds));

        if (string.IsNullOrEmpty(_host))
        {
            return;
        }

        try
        {
            await ExecuteCommandAsync("SET", key, raw, "EX", seconds.ToString()).ConfigureAwait(false);
        }
        catch
        {
            // Fallback silencioso a memoria
        }
    }

    public async Task RemoveAsync(string key)
    {
        _memory.TryRemove(key, out _);
        if (string.IsNullOrEmpty(_host))
        {
            return;
        }

        try
        {
            await ExecuteCommandAsync("DEL", key).ConfigureAwait(false);
        }
        catch
        {
            // Fallback silencioso
        }
    }

    private async Task<string?> ExecuteCommandAsync(params string[] args)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(1500));
        using var client = new TcpClient();
        await client.ConnectAsync(_host!, _port, cts.Token).ConfigureAwait(false);
        await using var stream = client.GetStream();

        var payload = EncodeRespCommand(args);
        await stream.WriteAsync(payload, cts.Token).ConfigureAwait(false);
        await stream.FlushAsync(cts.Token).ConfigureAwait(false);

        return await ReadRespBulkOrSimpleAsync(stream, cts.Token).ConfigureAwait(false);
    }

    private static byte[] EncodeRespCommand(string[] args)
    {
        using var ms = new MemoryStream();
        var header = Encoding.UTF8.GetBytes($"*{args.Length}\r\n");
        ms.Write(header, 0, header.Length);
        var crlf = "\r\n"u8;

        foreach (var arg in args)
        {
            var bytes = Encoding.UTF8.GetBytes(arg);
            var lenHeader = Encoding.UTF8.GetBytes($"${bytes.Length}\r\n");
            ms.Write(lenHeader, 0, lenHeader.Length);
            ms.Write(bytes, 0, bytes.Length);
            ms.Write(crlf);
        }

        return ms.ToArray();
    }

    private static async Task<string?> ReadRespBulkOrSimpleAsync(NetworkStream stream, CancellationToken ct)
    {
        var firstLine = await ReadLineAsync(stream, ct).ConfigureAwait(false);
        if (string.IsNullOrEmpty(firstLine))
        {
            return null;
        }

        var prefix = firstLine[0];
        var rest = firstLine[1..];

        if (prefix == '+' || prefix == ':')
        {
            return rest;
        }

        if (prefix == '-')
        {
            throw new InvalidOperationException(rest);
        }

        if (prefix == '$')
        {
            var byteLength = int.Parse(rest);
            if (byteLength < 0)
            {
                return null;
            }

            var buffer = new byte[byteLength + 2];
            var readTotal = 0;
            while (readTotal < buffer.Length)
            {
                var read = await stream.ReadAsync(buffer.AsMemory(readTotal, buffer.Length - readTotal), ct).ConfigureAwait(false);
                if (read == 0)
                {
                    break;
                }

                readTotal += read;
            }

            return Encoding.UTF8.GetString(buffer, 0, byteLength);
        }

        return null;
    }

    private static async Task<string> ReadLineAsync(NetworkStream stream, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        var oneByte = new byte[1];
        while (await stream.ReadAsync(oneByte, ct).ConfigureAwait(false) == 1)
        {
            if (oneByte[0] == '\n' && ms.Length > 0 && ms.GetBuffer()[ms.Length - 1] == '\r')
            {
                return Encoding.UTF8.GetString(ms.GetBuffer(), 0, (int)ms.Length - 1);
            }

            ms.WriteByte(oneByte[0]);
        }

        return Encoding.UTF8.GetString(ms.ToArray());
    }
}
