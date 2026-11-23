using System;
using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using AuthService.Domain.Constants;
using AuthService.Api.Filters;

namespace AuthService.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserManagementService _userManagementService;
        private readonly IRefreshTokenService _refreshTokenService;

        public AuthController(IAuthService authService, IUserManagementService userManagementService, IRefreshTokenService refreshTokenService)
        {
            _authService = authService;
            _userManagementService = userManagementService;
            _refreshTokenService = refreshTokenService;
        }
        private const string AccessCookieName = "kinal_access";
        private const string RefreshCookieName = "kinal_refresh";

        private void SetAuthCookies(string accessToken, string refreshToken, int expiresInSeconds = 900)
        {
            var isProd = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsProduction();
            Response.Cookies.Append(AccessCookieName, accessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = isProd,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromSeconds(expiresInSeconds),
            });
            Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = isProd,
                SameSite = SameSiteMode.Lax,
                Path = "/",
                MaxAge = TimeSpan.FromDays(30),
            });
        }

        private void ClearAuthCookies()
        {
            var isProd = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsProduction();
            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = isProd,
                SameSite = SameSiteMode.Lax,
                Path = "/",
            };
            Response.Cookies.Delete(AccessCookieName, options);
            Response.Cookies.Delete(RefreshCookieName, options);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto? dto)
        {
            var refreshToken = !string.IsNullOrWhiteSpace(dto?.RefreshToken)
                ? dto.RefreshToken
                : Request.Cookies[RefreshCookieName];
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return BadRequest(new { message = "Refresh token requerido" });
            }
            var result = await _refreshTokenService.RotateAsync(refreshToken);
            SetAuthCookies(result.AccessToken, result.RefreshToken, result.ExpiresIn);
            return Ok(result);
        }

        // El refresh token es la credencial (en body o en la cookie httpOnly kinal_refresh),
        // así se puede cerrar sesión aunque el access token ya haya expirado
        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout([FromBody] RefreshRequestDto? dto)
        {
            var refreshToken = !string.IsNullOrWhiteSpace(dto?.RefreshToken)
                ? dto.RefreshToken
                : Request.Cookies[RefreshCookieName];
            ClearAuthCookies();
            if (!string.IsNullOrWhiteSpace(refreshToken))
            {
                await _refreshTokenService.RevokeAsync(refreshToken);
            }
            return Ok(new { message = "Sesión cerrada" });
        }

        private async Task<bool> CurrentUserIsAdmin()
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userId)) return false;
            var roles = await _userManagementService.GetUserRolesAsync(userId);
            return roles.Contains(RoleConstants.ADMIN_ROLE);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<object>> GetProfile()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            {
                return Unauthorized();
            }

            var user = await _authService.GetUserByIdAsync(userIdClaim.Value);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(new
            {
                success = true,
                message = "Perfil obtenido exitosamente",
                data = user
            });
        }

        // Solo servicios internos: expone email y teléfono (soporta QUERY y POST)
        [AcceptVerbs("QUERY", "POST", Route = "profile/by-username")]
        [InternalServiceToken]
        public async Task<ActionResult<object>> GetProfileByUsername([FromBody] GetProfileByUsernameDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "El username es requerido"
                });
            }

            var user = await _authService.GetUserByUsernameAsync(request.Username.Trim());
            if (user == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Usuario no encontrado"
                });
            }

            return Ok(new
            {
                success = true,
                message = "Perfil obtenido exitosamente",
                data = user
            });
        }

        // Solo servicios internos: expone email y teléfono (soporta QUERY y POST)
        [AcceptVerbs("QUERY", "POST", Route = "profile/by-id")]
        [InternalServiceToken]
        public async Task<ActionResult<object>> GetProfileById([FromBody] GetProfileByIdDto request)
        {
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "El userId es requerido"
                });
            }

            var user = await _authService.GetUserByIdAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Usuario no encontrado"
                });
            }

            return Ok(new
            {
                success = true,
                message = "Perfil obtenido exitosamente",
                data = user
            });
        }
        [HttpPost("register")]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB límite
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<RegisterResponseDto>> Register([FromForm] RegisterDto registerDto)
        {
            var result = await _authService.RegisterAsync(registerDto);
            // Devolver 201 Created para registro
            return StatusCode(201, result);
        }

        [HttpPost("login")]
        [IgnoreAntiforgeryToken]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            var result = await _authService.LoginAsync(loginDto);
            SetAuthCookies(result.AccessToken, result.RefreshToken, result.ExpiresIn);
            return Ok(result);
        }

        [HttpPost("verify-email")]
        [EnableRateLimiting("ApiPolicy")]
        public async Task<ActionResult<EmailResponseDto>> VerifyEmail([FromBody] VerifyEmailDto verifyEmailDto)
        {
            var result = await _authService.VerifyEmailAsync(verifyEmailDto);

            // Token inválido o expirado: 400 como en auth-node (los clientes evalúan el status HTTP)
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("resend-verification")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<EmailResponseDto>> ResendVerification([FromBody] ResendVerificationDto resendDto)
        {
            var result = await _authService.ResendVerificationEmailAsync(resendDto);

            // Return appropriate status code based on result
            if (!result.Success)
            {
                if (result.Message.Contains("no encontrado", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }
                if (result.Message.Contains("ya ha sido verificado", StringComparison.OrdinalIgnoreCase) ||
                    result.Message.Contains("ya verificado", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(result);
                }
                // Email sending failed - Service Unavailable
                return StatusCode(503, result);
            }

            return Ok(result);
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<EmailResponseDto>> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            var result = await _authService.ForgotPasswordAsync(forgotPasswordDto);

            // ForgotPassword always returns success for security (even if user not found)
            // But if email sending fails, return 503
            if (!result.Success)
            {
                return StatusCode(503, result);
            }

            return Ok(result);
        }

        [HttpPost("reset-password")]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<EmailResponseDto>> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
        {
            var result = await _authService.ResetPasswordAsync(resetPasswordDto);

            // Token inválido o expirado: 400 como en auth-node (los clientes evalúan el status HTTP)
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("profile/picture")]
        [HttpPost("profile/picture/avatar")]
        [Authorize]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [EnableRateLimiting("ApiPolicy")]
        public async Task<ActionResult<object>> UpdateProfilePicture([FromForm] UpdateProfilePictureDto dto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "sub"
                || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

            if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
            {
                return Unauthorized(new { success = false, message = "Token inválido" });
            }

            var picture = dto.ProfilePicture ?? dto.Avatar;
            if (picture == null || picture.Size == 0)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "No se ha proporcionado ninguna imagen",
                });
            }

            var result = await _authService.UpdateProfilePictureAsync(
                userIdClaim.Value,
                picture);

            return Ok(new
            {
                success = true,
                message = "Foto de perfil actualizada exitosamente",
                data = result,
            });
        }

        [HttpGet("users")]
        [Authorize]
        [EnableRateLimiting("AuthPolicy")]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllUsers()
        {
            if (!await CurrentUserIsAdmin())
            {
                return StatusCode(403, new { success = false, message = "Forbidden" });
            }

            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }
    }
}
