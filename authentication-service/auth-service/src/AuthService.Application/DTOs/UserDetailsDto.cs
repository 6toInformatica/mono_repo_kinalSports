namespace AuthService.Application.DTOs;

public class UserDetailsDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    // Mismos campos que el userDetails de auth-node, para que ambos servicios sean intercambiables
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string ProfilePicture { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
