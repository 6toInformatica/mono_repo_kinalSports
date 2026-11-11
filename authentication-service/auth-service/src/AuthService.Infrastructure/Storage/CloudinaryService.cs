using AuthService.Application.Interfaces;
using AuthService.Infrastructure.Options;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace AuthService.Infrastructure.Storage;

public class CloudinaryService(IOptions<CloudinaryOptions> options) : ICloudinaryService
{
    private readonly CloudinaryOptions _settings = options.Value;

    private readonly Cloudinary _cloudinary = new(new Account(
        options.Value.CloudName,
        options.Value.ApiKey,
        options.Value.ApiSecret
    ));

    public async Task<string> UploadImageAsync(IFileData imageFile, string fileName)
    {
        try
        {
            using var stream = new MemoryStream(imageFile.Data);

            var folder = _settings.Folder
                         ?? "auth_service/profiles";

            var cleanName = Path.GetFileNameWithoutExtension(fileName);

            var publicId = $"{folder}/{cleanName}";

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(imageFile.FileName, stream),
                PublicId = publicId,
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                throw new InvalidOperationException($"Error uploading image: {uploadResult.Error.Message}");

            return $"v{uploadResult.Version}/{uploadResult.PublicId}.{uploadResult.Format}";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload image to Cloudinary: {ex.Message}", ex);
        }
    }

    public async Task<bool> DeleteImageAsync(string fileName)
    {
        try
        {
            var folder = _settings.Folder
                         ?? "auth_service/profiles";

            var withoutVersion = fileName.Contains('/')
                ? string.Join('/', fileName.Split('/').Skip(1))
                : fileName;

            var withoutExtension = Path.Combine(
                Path.GetDirectoryName(withoutVersion) ?? "",
                Path.GetFileNameWithoutExtension(withoutVersion)
            ).Replace("\\", "/");


            var deleteParams = new DelResParams
            {
                PublicIds = [withoutExtension]
            };

            var result = await _cloudinary.DeleteResourcesAsync(deleteParams);
            return result.Deleted?.ContainsKey(withoutExtension) == true;
        }
        catch
        {
            return false;
        }
    }


    // URL base de entrega: la configurada o, si falta, la de la cuenta configurada (CloudName)
    private string BaseUrl =>
        _settings.BaseUrl ?? $"https://res.cloudinary.com/{_settings.CloudName}/image/upload/";

    public string GetDefaultAvatarUrl()
    {
        var baseUrl = BaseUrl;
        var defaultPath = _settings.DefaultAvatarPath ?? "auth_service/profiles/avatarDefault-1749508519496_oam3k3";
        // Asegurar que tenga extensión .png
        if (!defaultPath.EndsWith(".png"))
            defaultPath += ".png";
        return $"{baseUrl}{defaultPath}";
    }

    public string GetFullImageUrl(string fileName)
    {
        var baseUrl = BaseUrl;

        if (string.IsNullOrWhiteSpace(fileName))
        {
            var version = "v1774318088";
            var defaultFile = _settings.DefaultAvatarPath ?? "avatarDefault-1749508519496_oam3k3";
            if (!defaultFile.EndsWith(".png"))
                defaultFile += ".png";
            var fileNameOnly = defaultFile.Split('/').Last();
            return $"{baseUrl}{version}/{fileNameOnly}";
        }

        if (fileName.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || fileName.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return fileName;
        }

        if (fileName.StartsWith("v", StringComparison.OrdinalIgnoreCase))
        {
            return $"{baseUrl}{fileName}";
        }

        var folder = _settings.Folder ?? "auth_service/profiles";
        var pathToUse = fileName.Contains('/')
            ? fileName
            : $"{folder}/{fileName}";

        return $"{baseUrl}w_400,h_400,c_fill,g_auto,q_auto,f_auto/{pathToUse}";
    }

}
