using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AuthService.Api.Filters;

/// <summary>
/// Restringe un endpoint a servicios internos (server-admin / server-user) que envíen
/// el header 'x-internal-token' con el valor de InternalServiceToken (equivalente a auth-node).
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class InternalServiceTokenAttribute : Attribute, IAuthorizationFilter
{
    private const string HeaderName = "x-internal-token";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var expected = configuration["InternalServiceToken"];
        var provided = context.HttpContext.Request.Headers[HeaderName].ToString();

        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(provided) ||
            !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(provided)))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                success = false,
                message = "Acceso denegado: Token interno inválido o ausente"
            });
        }
    }
}
