using AuthService.Infrastructure.Security;

namespace AuthService.Infrastructure.Tests.Security;

public class PasswordHashServiceTests
{
    private readonly PasswordHashService _sut = new();

    // Hash de "Admin1234!" que usan los datos iniciales (scripts/seed/users.sql).
    // Debe verificarse igual en auth-service y en auth-node.
    private const string SeedHash =
        "$argon2id$v=19$m=102400,t=2,p=8$mRyXBHRdsRK7ocCjSYKYog==$y8anYun/rVdeO8OsC/baakbUrOFgFTXk3MgHSGiCCNY=";

    [Fact]
    public void Verifica_el_hash_compartido_con_auth_node()
    {
        Assert.True(_sut.VerifyPassword("Admin1234!", SeedHash));
        Assert.False(_sut.VerifyPassword("admin1234!", SeedHash));
    }

    [Fact]
    public void Genera_hashes_argon2id_con_los_parametros_de_node_y_sal_aleatoria()
    {
        var first = _sut.HashPassword("Nueva12345!");
        var second = _sut.HashPassword("Nueva12345!");

        Assert.StartsWith("$argon2id$v=19$m=102400,t=2,p=8$", first);
        Assert.NotEqual(first, second);
        Assert.True(_sut.VerifyPassword("Nueva12345!", first));
        Assert.False(_sut.VerifyPassword("otra", first));
    }

    [Theory]
    [InlineData("")]
    [InlineData("no-es-un-hash")]
    [InlineData("$argon2id$v=19$roto")]
    public void Un_hash_con_formato_invalido_se_trata_como_contrasena_incorrecta(string hash)
    {
        Assert.False(_sut.VerifyPassword("Admin1234!", hash));
    }
}
