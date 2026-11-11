using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using AuthService.Application.Interfaces;
using AuthService.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Email;

/// <summary>
/// Envío por Kinal Mail Hub: POST /api/v1/messages con la API key del proyecto (Bearer).
/// </summary>
public partial class KinalMailHubEmailService(
    HttpClient http,
    IOptions<KinalMailHubOptions> kmhOptions,
    IOptions<SmtpOptions> smtpOptions,
    IOptions<AppOptions> appOptions,
    ILogger<KinalMailHubEmailService> logger) : IEmailService
{
    private readonly KinalMailHubOptions _kmh = kmhOptions.Value;
    // Se conserva UseFallback de SmtpSettings: con él activo, un fallo de envío solo se registra
    private readonly bool _useFallback = smtpOptions.Value.UseFallback;
    private readonly string? _frontendUrl = appOptions.Value.FrontendUrl;

    public Task SendEmailVerificationAsync(string email, string username, string token)
    {
        var (subject, body) = EmailTemplates.Verification(_frontendUrl, username, token);
        return SendEmailAsync(email, subject, body);
    }

    public Task SendPasswordResetAsync(string email, string username, string token)
    {
        var (subject, body) = EmailTemplates.PasswordReset(_frontendUrl, username, token);
        return SendEmailAsync(email, subject, body);
    }

    public Task SendWelcomeEmailAsync(string email, string username)
    {
        var (subject, body) = EmailTemplates.Welcome(username);
        return SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string html)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_kmh.ApiKey))
            {
                throw new InvalidOperationException("Kinal Mail Hub API key is not configured");
            }

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_kmh.BaseUrl.TrimEnd('/')}/api/v1/messages");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _kmh.ApiKey);
            request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
            request.Content = JsonContent.Create(new
            {
                from = _kmh.From,
                to = new[] { to },
                subject,
                html,
                text = ToPlainText(html),
            });

            using var response = await http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var detail = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException(
                    $"Kinal Mail Hub responded {(int)response.StatusCode}: {Truncate(detail, 300)}");
            }

            var result = await response.Content.ReadFromJsonAsync<KmhResponse>();
            logger.LogInformation(
                "Email accepted by Kinal Mail Hub (correlationId={CorrelationId}, status={Status})",
                result?.CorrelationId, result?.Status);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email");

            if (_useFallback)
            {
                logger.LogWarning("Using email fallback");
                return;
            }

            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }

    private static string ToPlainText(string html)
    {
        var withLinks = AnchorRegex().Replace(html, "$2: $1");
        var withoutTags = TagRegex().Replace(withLinks, string.Empty);
        return string.Join('\n', withoutTags
            .Split('\n')
            .Select(line => line.Trim())
            .Where(line => line.Length > 0));
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];

    [GeneratedRegex(@"<a\s[^>]*href=['""]([^'""]+)['""][^>]*>\s*([\s\S]*?)\s*</a>", RegexOptions.IgnoreCase)]
    private static partial Regex AnchorRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex TagRegex();

    private sealed record KmhResponse(string? CorrelationId, string? Status);
}
