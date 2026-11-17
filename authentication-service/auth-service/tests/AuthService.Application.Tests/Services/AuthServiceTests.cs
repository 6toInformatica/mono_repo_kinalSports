using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;
using AuthService.Application.Exceptions;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using static AuthService.Application.Tests.TestData;
using Sut = AuthService.Application.Services.AuthService;

namespace AuthService.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly IRefreshTokenService _refreshTokens = Substitute.For<IRefreshTokenService>();
    private readonly IUserRepository _users = Substitute.For<IUserRepository>();
    private readonly IRoleRepository _roles = Substitute.For<IRoleRepository>();
    private readonly IPasswordHashService _passwords = Substitute.For<IPasswordHashService>();
    private readonly IJwtTokenService _jwt = Substitute.For<IJwtTokenService>();
    private readonly ICloudinaryService _cloudinary = Substitute.For<ICloudinaryService>();
    private readonly IEmailService _emails = Substitute.For<IEmailService>();
    private readonly Sut _sut;

    public AuthServiceTests()
    {
        _passwords.HashPassword(Arg.Any<string>()).Returns("hash-nuevo");
        _passwords.VerifyPassword(Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _jwt.GenerateTokenAsync(Arg.Any<string>(), Arg.Any<int>()).Returns("access-token");
        _refreshTokens.CreateAsync(Arg.Any<string>(), Arg.Any<Guid?>()).Returns(("refresh-token", Guid.NewGuid()));
        _cloudinary.GetDefaultAvatarUrl().Returns("avatarDefault.png");
        _cloudinary.GetFullImageUrl(Arg.Any<string>()).Returns(c => $"https://cdn.test/{c.Arg<string>()}");
        _roles.GetByNameAsync("USER_ROLE").Returns(new Role { Id = "rol1", Name = "USER_ROLE" });
        _users.CreateAsync(Arg.Any<User>()).Returns(c => c.Arg<User>());
        _users.UpdateAsync(Arg.Any<User>()).Returns(c => c.Arg<User>());

        _sut = new Sut(_refreshTokens, _users, _roles, _passwords, _jwt, _cloudinary, _emails, NullLogger<Sut>.Instance);
    }

    private static RegisterDto ARegistration(IFileData? picture = null) => new()
    {
        Name = "Andrea",
        Surname = "Morales",
        Username = "andrea.morales",
        Email = "Andrea.Morales@KinalSports.gt",
        Password = "Admin1234!",
        Phone = "42178935",
        ProfilePicture = picture,
    };

    // ---------- Registro ----------

    [Fact]
    public async Task Registro_crea_un_usuario_inactivo_con_token_de_verificacion_de_24_horas()
    {
        var result = await _sut.RegisterAsync(ARegistration());

        await _users.Received(1).CreateAsync(Arg.Is<User>(u =>
            u.Email == "andrea.morales@kinalsports.gt" // en minúsculas
            && u.Password == "hash-nuevo"
            && !u.Status
            && u.UserProfile!.ProfilePicture == "avatarDefault.png"
            && u.UserRoles.Single().RoleId == "rol1"
            && u.UserEmail!.EmailVerificationToken!.Length > 40
            && u.UserEmail.EmailVerificationTokenExpiry > DateTime.UtcNow.AddHours(23.9)));
        Assert.True(result.Success);
        Assert.True(result.EmailVerificationRequired);
    }

    [Fact]
    public async Task Registro_rechaza_email_repetido()
    {
        _users.ExistsByEmailAsync(Arg.Any<string>()).Returns(true);

        var error = await Assert.ThrowsAsync<BusinessException>(() => _sut.RegisterAsync(ARegistration()));

        Assert.Equal(ErrorCodes.EMAIL_ALREADY_EXISTS, error.ErrorCode);
        await _users.DidNotReceive().CreateAsync(Arg.Any<User>());
    }

    [Fact]
    public async Task Registro_rechaza_username_repetido()
    {
        _users.ExistsByUsernameAsync(Arg.Any<string>()).Returns(true);

        var error = await Assert.ThrowsAsync<BusinessException>(() => _sut.RegisterAsync(ARegistration()));

        Assert.Equal(ErrorCodes.USERNAME_ALREADY_EXISTS, error.ErrorCode);
    }

    [Fact]
    public async Task Registro_rechaza_una_imagen_con_formato_invalido()
    {
        var error = await Assert.ThrowsAsync<BusinessException>(
            () => _sut.RegisterAsync(ARegistration(new FakeFile("foto.gif", "image/gif", 100))));

        Assert.Equal(ErrorCodes.INVALID_FILE_FORMAT, error.ErrorCode);
    }

    [Fact]
    public async Task Registro_sube_la_foto_a_cloudinary()
    {
        _cloudinary.UploadImageAsync(Arg.Any<IFileData>(), Arg.Any<string>()).Returns("v1/profile-abc.png");

        await _sut.RegisterAsync(ARegistration(new FakeFile("foto.png", "image/png", 100)));

        await _users.Received(1).CreateAsync(Arg.Is<User>(u => u.UserProfile!.ProfilePicture == "v1/profile-abc.png"));
    }

    [Fact]
    public async Task Registro_falla_si_no_existe_el_rol_por_defecto()
    {
        _roles.GetByNameAsync("USER_ROLE").Returns((Role?)null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.RegisterAsync(ARegistration()));
    }

    // ---------- Login ----------

    [Fact]
    public async Task Login_por_username_devuelve_tokens_y_rol()
    {
        _users.GetByUsernameAsync("andrea.morales").Returns(AUser(role: "ADMIN_ROLE"));

        var result = await _sut.LoginAsync(new LoginDto { EmailOrUsername = "andrea.morales", Password = "Admin1234!" });

        Assert.Equal("access-token", result.AccessToken);
        Assert.Equal("refresh-token", result.RefreshToken);
        Assert.Equal(900, result.ExpiresIn);
        Assert.Equal("ADMIN_ROLE", result.UserDetails!.Role);
        await _jwt.Received(1).GenerateTokenAsync("usr_SeedUser0002", 15);
    }

    [Fact]
    public async Task Login_por_email_busca_en_minusculas()
    {
        _users.GetByEmailAsync("andrea.morales@kinalsports.gt").Returns(AUser());

        await _sut.LoginAsync(new LoginDto { EmailOrUsername = "ANDREA.MORALES@kinalsports.gt", Password = "x" });

        await _users.Received(1).GetByEmailAsync("andrea.morales@kinalsports.gt");
    }

    [Fact]
    public async Task Login_rechaza_usuario_inexistente()
    {
        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { EmailOrUsername = "nadie", Password = "x" }));

        Assert.Equal("Invalid credentials", error.Message);
    }

    [Fact]
    public async Task Login_rechaza_contrasena_incorrecta_sin_emitir_tokens()
    {
        _users.GetByUsernameAsync("andrea.morales").Returns(AUser());
        _passwords.VerifyPassword(Arg.Any<string>(), Arg.Any<string>()).Returns(false);

        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { EmailOrUsername = "andrea.morales", Password = "mala" }));

        Assert.Equal("Invalid credentials", error.Message);
        await _refreshTokens.DidNotReceive().CreateAsync(Arg.Any<string>(), Arg.Any<Guid?>());
    }

    [Fact]
    public async Task Login_rechaza_cuenta_desactivada()
    {
        _users.GetByUsernameAsync("andrea.morales").Returns(AUser(status: false));

        var error = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { EmailOrUsername = "andrea.morales", Password = "x" }));

        Assert.Equal("User account is disabled", error.Message);
    }

    // ---------- Verificación de email ----------

    [Fact]
    public async Task Verificar_email_activa_la_cuenta_y_consume_el_token()
    {
        var user = AUser(status: false, verified: false);
        user.UserEmail!.EmailVerificationToken = "token";
        _users.GetByEmailVerificationTokenAsync("token").Returns(user);

        var result = await _sut.VerifyEmailAsync(new VerifyEmailDto { Token = "token" });

        Assert.True(result.Success);
        Assert.True(user.Status);
        Assert.True(user.UserEmail.EmailVerified);
        Assert.Null(user.UserEmail.EmailVerificationToken);
        await _emails.Received(1).SendWelcomeEmailAsync(user.Email, user.Username);
    }

    [Fact]
    public async Task Verificar_email_con_token_invalido_no_modifica_nada()
    {
        var result = await _sut.VerifyEmailAsync(new VerifyEmailDto { Token = "x" });

        Assert.False(result.Success);
        await _users.DidNotReceive().UpdateAsync(Arg.Any<User>());
    }

    [Fact]
    public async Task Verificar_email_no_falla_si_el_correo_de_bienvenida_falla()
    {
        _users.GetByEmailVerificationTokenAsync("token").Returns(AUser(verified: false));
        _emails.SendWelcomeEmailAsync(Arg.Any<string>(), Arg.Any<string>()).Returns(Task.FromException(new Exception("caído")));

        var result = await _sut.VerifyEmailAsync(new VerifyEmailDto { Token = "token" });

        Assert.True(result.Success);
    }

    // ---------- Reenvío de verificación ----------

    [Fact]
    public async Task Reenviar_genera_un_token_nuevo_y_envia_el_correo()
    {
        var user = AUser(verified: false);
        _users.GetByEmailAsync(user.Email).Returns(user);

        var result = await _sut.ResendVerificationEmailAsync(new ResendVerificationDto { Email = user.Email });

        Assert.True(result.Success);
        Assert.NotNull(user.UserEmail!.EmailVerificationToken);
        await _emails.Received(1).SendEmailVerificationAsync(user.Email, user.Username, user.UserEmail.EmailVerificationToken!);
    }

    [Fact]
    public async Task Reenviar_a_un_email_ya_verificado_no_envia_nada()
    {
        _users.GetByEmailAsync(Arg.Any<string>()).Returns(AUser());

        var result = await _sut.ResendVerificationEmailAsync(new ResendVerificationDto { Email = "x@kinal.gt" });

        Assert.False(result.Success);
        Assert.Equal("El email ya ha sido verificado", result.Message);
        await _emails.DidNotReceiveWithAnyArgs().SendEmailVerificationAsync(default!, default!, default!);
    }

    [Fact]
    public async Task Reenviar_informa_si_el_envio_falla()
    {
        _users.GetByEmailAsync(Arg.Any<string>()).Returns(AUser(verified: false));
        _emails.SendEmailVerificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromException(new Exception("caído")));

        var result = await _sut.ResendVerificationEmailAsync(new ResendVerificationDto { Email = "x@kinal.gt" });

        Assert.False(result.Success);
        Assert.Equal("Error al enviar el email de verificación", result.Message);
    }

    // ---------- Recuperación de contraseña ----------

    [Fact]
    public async Task Olvide_contrasena_responde_igual_exista_o_no_el_usuario()
    {
        var missing = await _sut.ForgotPasswordAsync(new ForgotPasswordDto { Email = "nadie@kinal.gt" });

        var user = AUser();
        _users.GetByEmailAsync(user.Email).Returns(user);
        var existing = await _sut.ForgotPasswordAsync(new ForgotPasswordDto { Email = user.Email });

        Assert.True(missing.Success);
        Assert.Equal(missing.Message, existing.Message);
        Assert.NotNull(user.UserPasswordReset!.PasswordResetToken);
        Assert.True(user.UserPasswordReset.PasswordResetTokenExpiry <= DateTime.UtcNow.AddHours(1));
        await _emails.Received(1).SendPasswordResetAsync(user.Email, user.Username, user.UserPasswordReset.PasswordResetToken!);
    }

    [Fact]
    public async Task Reset_cambia_la_contrasena_consume_el_token_y_cierra_sesiones()
    {
        var user = AUser();
        user.UserPasswordReset!.PasswordResetToken = "token";
        _users.GetByPasswordResetTokenAsync("token").Returns(user);

        var result = await _sut.ResetPasswordAsync(new ResetPasswordDto { Token = "token", NewPassword = "Nueva12345!" });

        Assert.True(result.Success);
        Assert.Equal("hash-nuevo", user.Password);
        Assert.Null(user.UserPasswordReset.PasswordResetToken);
        await _refreshTokens.Received(1).RevokeAllForUserAsync(user.Id);
    }

    [Fact]
    public async Task Reset_con_token_invalido_no_cambia_nada()
    {
        var result = await _sut.ResetPasswordAsync(new ResetPasswordDto { Token = "x", NewPassword = "Nueva12345!" });

        Assert.False(result.Success);
        _passwords.DidNotReceive().HashPassword(Arg.Any<string>());
        await _refreshTokens.DidNotReceive().RevokeAllForUserAsync(Arg.Any<string>());
    }

    // ---------- Foto de perfil ----------

    [Fact]
    public async Task Cambiar_foto_borra_la_anterior_salvo_el_avatar_por_defecto()
    {
        var user = AUser();
        user.UserProfile!.ProfilePicture = "v1/vieja.png";
        _users.GetByIdAsync(user.Id).Returns(user);
        _cloudinary.UploadImageAsync(Arg.Any<IFileData>(), Arg.Any<string>()).Returns("v2/nueva.png");

        await _sut.UpdateProfilePictureAsync(user.Id, new FakeFile("nueva.png", "image/png", 100));

        await _cloudinary.Received(1).DeleteImageAsync("v1/vieja.png");
        Assert.Equal("v2/nueva.png", user.UserProfile.ProfilePicture);
    }

    [Fact]
    public async Task Cambiar_foto_no_borra_el_avatar_por_defecto()
    {
        var user = AUser();
        user.UserProfile!.ProfilePicture = "auth_service/profiles/avatarDefault-123";
        _users.GetByIdAsync(user.Id).Returns(user);
        _cloudinary.UploadImageAsync(Arg.Any<IFileData>(), Arg.Any<string>()).Returns("v2/nueva.png");

        await _sut.UpdateProfilePictureAsync(user.Id, new FakeFile("nueva.png", "image/png", 100));

        await _cloudinary.DidNotReceive().DeleteImageAsync(Arg.Any<string>());
    }
}
