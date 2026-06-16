using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class GetProfileByUsernameDto
{
    [Required(ErrorMessage = "El username es requerido")]
    public string Username { get; set; } = string.Empty;
}
