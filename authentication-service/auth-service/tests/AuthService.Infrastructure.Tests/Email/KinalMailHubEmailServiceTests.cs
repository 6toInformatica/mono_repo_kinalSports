using System.Net;
using System.Text.Json;
using AuthService.Infrastructure.Email;
using AuthService.Infrastructure.Options;
using Microsoft.Extensions.Logging.Abstractions;
using MsOptions = Microsoft.Extensions.Options.Options;

namespace AuthService.Infrastructure.Tests.Email;

public class KinalMailHubEmailServiceTests
{
    /// <summary>Handler falso: guarda la petición y responde lo que se le indique.</summary>
    private sealed class FakeHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            RequestBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status) { Content = new StringContent(body) };
        }
    }

    private static (KinalMailHubEmailService Service, FakeHandler Handler) Create(
        HttpStatusCode status = HttpStatusCode.Created,
        string body = """{"correlationId":"abc","status":"CAPTURED_IN_MAILPIT"}""",
        string? apiKey = "kmh_live_test",
        bool useFallback = false)
    {
        var handler = new FakeHandler(status, body);
        var service = new KinalMailHubEmailService(
            new HttpClient(handler),
            MsOptions.Create(new KinalMailHubOptions
            {
                BaseUrl = "https://mail.test/",
                From = "kinal-sports@am-delta.test",
                ApiKey = apiKey,
            }),
            MsOptions.Create(new SmtpOptions { UseFallback = useFallback }),
            MsOptions.Create(new AppOptions { FrontendUrl = "http://localhost:3000" }),
            NullLogger<KinalMailHubEmailService>.Instance);
        return (service, handler);
    }

    [Fact]
    public async Task Envia_el_correo_de_verificacion_al_gateway()
    {
        var (service, handler) = Create();

        await service.SendEmailVerificationAsync("andrea@kinalsports.gt", "andrea", "tok123");

        Assert.Equal(HttpMethod.Post, handler.Request!.Method);
        Assert.Equal("https://mail.test/api/v1/messages", handler.Request.RequestUri!.ToString());
        Assert.Equal("Bearer", handler.Request.Headers.Authorization!.Scheme);
        Assert.Equal("kmh_live_test", handler.Request.Headers.Authorization.Parameter);
        Assert.True(handler.Request.Headers.Contains("Idempotency-Key"));

        using var json = JsonDocument.Parse(handler.RequestBody!);
        var root = json.RootElement;
        Assert.Equal("kinal-sports@am-delta.test", root.GetProperty("from").GetString());
        Assert.Equal("andrea@kinalsports.gt", root.GetProperty("to")[0].GetString());
        Assert.Contains("http://localhost:3000/verify-email?token=tok123", root.GetProperty("html").GetString());
        // El texto plano no lleva etiquetas HTML
        Assert.DoesNotContain("<", root.GetProperty("text").GetString());
    }

    [Fact]
    public async Task Falla_si_el_gateway_responde_un_error()
    {
        var (service, _) = Create(HttpStatusCode.Unauthorized, """{"error":"invalid key"}""");

        var error = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendWelcomeEmailAsync("andrea@kinalsports.gt", "andrea"));

        Assert.Contains("401", error.Message);
    }

    [Fact]
    public async Task Falla_sin_api_key_y_no_llama_al_gateway()
    {
        var (service, handler) = Create(apiKey: null);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendPasswordResetAsync("andrea@kinalsports.gt", "andrea", "tok"));

        Assert.Null(handler.Request);
    }

    [Fact]
    public async Task Con_fallback_activo_no_lanza_el_error()
    {
        var (service, _) = Create(HttpStatusCode.InternalServerError, "boom", useFallback: true);

        await service.SendWelcomeEmailAsync("andrea@kinalsports.gt", "andrea");
    }
}
