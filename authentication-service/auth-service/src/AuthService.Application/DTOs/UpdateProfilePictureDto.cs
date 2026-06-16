using AuthService.Application.Interfaces;

namespace AuthService.Application.DTOs;

public class UpdateProfilePictureDto
{
    public IFileData? ProfilePicture { get; set; }
}
