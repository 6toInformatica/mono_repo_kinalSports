using AuthService.Application.Validators;
using static AuthService.Application.Tests.TestData;

namespace AuthService.Application.Tests.Validators;

public class FileValidatorTests
{
    [Theory]
    [InlineData("foto.jpg", "image/jpeg")]
    [InlineData("foto.PNG", "image/png")]
    [InlineData("foto.webp", "image/webp")]
    public void Acepta_imagenes_permitidas(string name, string type)
    {
        var (isValid, error) = FileValidator.ValidateImage(new FakeFile(name, type, 1024));

        Assert.True(isValid);
        Assert.Null(error);
    }

    [Theory]
    [InlineData("foto.gif", "image/gif", 1024, "Only the following file types")]
    [InlineData("foto.png", "application/pdf", 1024, "Invalid file type")]
    [InlineData("foto.png", "image/png", 0, "File is required")]
    [InlineData("foto.png", "image/png", 5 * 1024 * 1024 + 1, "cannot exceed 5MB")]
    public void Rechaza_archivos_invalidos(string name, string type, long size, string message)
    {
        var (isValid, error) = FileValidator.ValidateImage(new FakeFile(name, type, size));

        Assert.False(isValid);
        Assert.Contains(message, error);
    }

    [Fact]
    public void Genera_un_nombre_unico_conservando_la_extension_en_minusculas()
    {
        var first = FileValidator.GenerateSecureFileName("Mi Foto.PNG");
        var second = FileValidator.GenerateSecureFileName("Mi Foto.PNG");

        Assert.Matches("^profile-[0-9a-f]{12}\\.png$", first);
        Assert.NotEqual(first, second);
    }
}
