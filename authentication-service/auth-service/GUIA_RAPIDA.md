# Guía Rápida — Recreación Paso a Paso de AuthService (.NET 10)

> **Propósito del documento:** Guía técnica y formativa resumida para reconstruir `auth-service` desde cero bajo **Clean Architecture** en **.NET 10 (`net10.0`, C# 14)**.
>
> **Para operar el servicio existente dentro del monorepo:** Consulta [README.md](./README.md), el [README principal del monorepo](../../README.md) y `docker-compose.yml`.
>
> **Parámetros verificados del servicio:** Puerto HTTP `5156`, prefijo `/api/v1`, PostgreSQL 18 en puerto `5435` (`Database=kinal_sports`), Redis 7 en puerto `6379`.

---

## Diagrama de Flujo de Construcción (De Adentro hacia Afuera)

```text
1. CREAR ESTRUCTURA BASE (.NET 10, global.json, Directory.Build.props y 5 proyectos)
        ↓
2. DEFINIR CAPA DOMAIN (Entidades, Constantes e Interfaces de Repositorio)
        ↓
3. DEFINIR CAPA APPLICATION (Casos de Uso, DTOs, Validadores y Puertos)
        ↓
4. IMPLEMENTAR CAPA INFRASTRUCTURE (Argon2id, JWT, RedisCacheService, KMH/SMTP, Cloudinary)
        ↓
5. IMPLEMENTAR CAPA PERSISTENCE (ApplicationDbContext, snake_case, Migraciones, Repositorios, DataSeeder)
        ↓
6. CONFIGURAR CAPA API (Extensions, Cookies httpOnly, Guards/Filters, Controllers y Program.cs)
        ↓
7. CREAR PROYECTOS DE PRUEBAS UNITARIAS (xUnit v3 + NSubstitute)
```

---

## Paso 1: Crear la Estructura Base del Proyecto (.NET 10)

### 1.1 Crear la solución y archivos de configuración global

```bash
mkdir -p authentication-service/auth-service
cd authentication-service/auth-service

dotnet new sln -n AuthService
```

Crear `global.json` para fijar el SDK `.NET 10`:

```json
{
    "sdk": {
        "version": "10.0.100",
        "rollForward": "latestFeature",
        "allowPrerelease": false
    }
}
```

Crear `Directory.Build.props` en la raíz del servicio para centralizar `net10.0` y `C# 14`:

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>14.0</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
  </PropertyGroup>
</Project>
```

### 1.2 Crear los 5 proyectos de código fuente (`src/`) y los 2 de pruebas (`tests/`)

```bash
mkdir -p src tests

# Capas de Clean Architecture
dotnet new classlib -n AuthService.Domain -o src/AuthService.Domain -f net10.0
dotnet new classlib -n AuthService.Application -o src/AuthService.Application -f net10.0
dotnet new classlib -n AuthService.Infrastructure -o src/AuthService.Infrastructure -f net10.0
dotnet new classlib -n AuthService.Persistence -o src/AuthService.Persistence -f net10.0
dotnet new webapi -n AuthService.Api -o src/AuthService.Api -f net10.0

# Proyectos de pruebas unitarias
dotnet new classlib -n AuthService.Application.Tests -o tests/AuthService.Application.Tests -f net10.0
dotnet new classlib -n AuthService.Infrastructure.Tests -o tests/AuthService.Infrastructure.Tests -f net10.0

# Registrar todos los proyectos en la solución
dotnet sln add src/*/*.csproj tests/*/*.csproj
```

### 1.3 Configurar las referencias entre capas

```bash
# Application -> Domain
dotnet add src/AuthService.Application reference src/AuthService.Domain

# Infrastructure -> Application (y transitivamente Domain)
dotnet add src/AuthService.Infrastructure reference src/AuthService.Application

# Persistence -> Domain y Application
dotnet add src/AuthService.Persistence reference src/AuthService.Domain src/AuthService.Application

# Api -> Application, Infrastructure y Persistence
dotnet add src/AuthService.Api reference \
  src/AuthService.Application \
  src/AuthService.Infrastructure \
  src/AuthService.Persistence
```

### 1.4 Instalar paquetes NuGet verificados por capa

**En `src/AuthService.Application`:**

```bash
dotnet add src/AuthService.Application package FluentValidation --version 12.2.0
dotnet add src/AuthService.Application package FluentValidation.DependencyInjectionExtensions --version 12.2.0
dotnet add src/AuthService.Application package Microsoft.Extensions.Logging.Abstractions --version 10.0.14
```

**En `src/AuthService.Infrastructure`:**

```bash
dotnet add src/AuthService.Infrastructure package Konscious.Security.Cryptography.Argon2 --version 1.3.1
dotnet add src/AuthService.Infrastructure package System.IdentityModel.Tokens.Jwt --version 8.23.0
dotnet add src/AuthService.Infrastructure package Microsoft.IdentityModel.Tokens --version 8.23.0
dotnet add src/AuthService.Infrastructure package MailKit --version 4.18.2
dotnet add src/AuthService.Infrastructure package CloudinaryDotNet --version 1.29.3
dotnet add src/AuthService.Infrastructure package Microsoft.Extensions.Http --version 10.0.14
dotnet add src/AuthService.Infrastructure package Microsoft.Extensions.Options.ConfigurationExtensions --version 10.0.14
```

**En `src/AuthService.Persistence`:**

```bash
dotnet add src/AuthService.Persistence package Microsoft.EntityFrameworkCore --version 10.0.14
dotnet add src/AuthService.Persistence package Microsoft.EntityFrameworkCore.Design --version 10.0.14
dotnet add src/AuthService.Persistence package Microsoft.EntityFrameworkCore.Tools --version 10.0.14
dotnet add src/AuthService.Persistence package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.3
dotnet add src/AuthService.Persistence package EFCore.NamingConventions --version 10.0.1
```

**En `src/AuthService.Api`:**

```bash
dotnet add src/AuthService.Api package Microsoft.AspNetCore.Authentication.JwtBearer --version 10.0.14
dotnet add src/AuthService.Api package Microsoft.AspNetCore.OpenApi --version 10.0.14
dotnet add src/AuthService.Api package Swashbuckle.AspNetCore --version 10.3.1
dotnet add src/AuthService.Api package Serilog.AspNetCore --version 10.0.0
dotnet add src/AuthService.Api package NetEscapades.AspNetCore.SecurityHeaders --version 10.0.0 || \
  dotnet add src/AuthService.Api package NetEscapades.AspNetCore.SecurityHeaders --version 1.3.1
```

---

## Paso 2: Definir la Capa `AuthService.Domain`

```bash
mkdir -p src/AuthService.Domain/{Entities,Enums,Constants,Interfaces}
```

- **Constantes y Enums:**
    - `Constants/RoleConstants.cs`: Define `ADMIN_ROLE`, `USER_ROLE` y `AllowedRoles`.
    - `Enums/UserRole.cs`: Enumeración de roles del dominio.
- **Entidades (`Entities/`):**
    - `User.cs`: `Id` (`varchar(16)`), `Name`, `Surname`, `Username`, `Email`, `Password`, `Status`, `CreatedAt`, `UpdatedAt` y propiedades de navegación.
    - `UserProfile.cs`: `Id`, `UserId`, `ProfilePicture`, `Phone`.
    - `Role.cs` y `UserRole.cs`: Relación muchos-a-muchos entre usuarios y roles.
    - `UserEmail.cs`: Estado de verificación (`EmailVerified`), token y expiración.
    - `UserPasswordReset.cs`: Token y expiración de recuperación de contraseña.
    - `RefreshToken.cs`: `Id`, `UserId`, `Token` (único), `ExpiresAt`, `RevokedAt`, `ReplacedByToken`, `CreatedAt`.
- **Interfaces de Repositorio (`Interfaces/`):**
    - `IUserRepository.cs`: `GetByIdAsync`, `GetByEmailAsync`, `GetByUsernameAsync`, `GetByEmailOrUsernameAsync`, `GetAllAsync`, `CreateAsync`, `UpdateAsync`, `DeleteAsync`, `UpdateUserRoleAsync`, `ExistsByEmailAsync`, `ExistsByUsernameAsync`.
    - `IRoleRepository.cs`: `GetByNameAsync`, `CountUsersInRoleAsync`, `GetUsersByRoleAsync`, `GetUserRoleNamesAsync`.
    - `IRefreshTokenRepository.cs`: `CreateAsync`, `GetByTokenAsync`, `RevokeAsync`, `RevokeAllForUserAsync`.

---

## Paso 3: Definir la Capa `AuthService.Application`

```bash
mkdir -p src/AuthService.Application/{DTOs,DTOs/Email,Exceptions,Interfaces,Services,Validators,Extensions}
```

- **Puertos de Infraestructura (`Interfaces/`):**
    - `IAuthService.cs`, `IUserManagementService.cs`, `IRefreshTokenService.cs`
    - `IJwtTokenService.cs`, `IPasswordHashService.cs`, `IEmailService.cs`, `ICloudinaryService.cs`
    - `ICacheService.cs`: `GetAsync<T>`, `SetAsync<T>`, `RemoveAsync`, `RemoveByPrefixAsync`.
- **DTOs principales (`DTOs/`):**
    - Entrada: `RegisterDto`, `LoginDto`, `RefreshRequestDto`, `VerifyEmailDto`, `ResendVerificationDto`, `ForgotPasswordDto`, `ResetPasswordDto`, `UpdateUserRoleDto`, `UpdateProfilePictureDto`, `GetProfileByIdDto`, `GetProfileByUsernameDto`.
    - Salida: `AuthResponseDto` (incluye `Token` y `RefreshToken`), `RegisterResponseDto`, `UserResponseDto`, `UserDetailsDto`, `EmailResponseDto`.
- **Servicios de Aplicación (`Services/`):**
    - `AuthService.cs`: Implementa registro, login, verificación de correo, restablecimiento de contraseña, consulta de perfil (`GetUserByIdAsync` usando `ICacheService` bajo la clave `kinal:user:profile:{userId}` con TTL de 60 s) e invalidación de caché al actualizar avatar o verificar correo.
    - `RefreshTokenService.cs`: Emisión, rotación y revocación por detección de reúso de _refresh tokens_.
    - `UserManagementService.cs`: Cambio de rol (`UpdateUserRoleAsync` con invalidación de `kinal:user:profile:{userId}`), consulta de usuarios por rol y listado administrativo.

---

## Paso 4: Implementar la Capa `AuthService.Infrastructure`

```bash
mkdir -p src/AuthService.Infrastructure/{Cache,Email,Options,Security,Storage}
```

- `Security/PasswordHashService.cs`: Hashing y verificación `Argon2id` (`MemorySize = 102400`, `Iterations = 2`, `DegreeOfParallelism = 8`) compatible con `auth-node`.
- `Security/JwtTokenService.cs`: Firma de tokens `HS256` con claims `sub`, `jti`, `iat` y `role`.
- `Cache/RedisCacheService.cs`: Implementa `ICacheService` hablando protocolo `RESP2` sobre TCP contra `REDIS_URL` (o `Redis:ConnectionString`), degradando automáticamente a `ConcurrentDictionary` en memoria si Redis no está configurado.
- `Email/KinalMailHubEmailService.cs` y `Email/EmailService.cs`: Envío de correos mediante la API REST de Kinal Mail Hub (`Provider = "kmh"`) o SMTP con MailKit (`Provider = "smtp"`).
- `Storage/CloudinaryService.cs`: Subida y eliminación de avatares en Cloudinary.
- `DependencyInjection.cs`: Método de extensión `AddInfrastructure(IConfiguration)`.

---

## Paso 5: Implementar la Capa `AuthService.Persistence`

```bash
mkdir -p src/AuthService.Persistence/{Data,Repositories,Migrations}
```

- `Data/ApplicationDbContext.cs`: Configura las entidades (`Users`, `UserProfiles`, `Roles`, `UserRoles`, `UserEmails`, `UserPasswordResets`, `RefreshTokens`), índices únicos, llaves foráneas y convención `snake_case`.
- `Data/DataSeeder.cs`: Siembra de forma idempotente los roles `ADMIN_ROLE` y `USER_ROLE` y el usuario administrador inicial (`Seed:AdminPassword`).
- `Repositories/`: `UserRepository.cs`, `RoleRepository.cs` y `RefreshTokenRepository.cs`.
- **Comandos de migración EF Core:**
    ```bash
    dotnet ef migrations add InitialCreate --project src/AuthService.Persistence --startup-project src/AuthService.Api
    dotnet ef database update --project src/AuthService.Persistence --startup-project src/AuthService.Api
    ```

---

## Paso 6: Configurar la Capa `AuthService.Api`

```bash
mkdir -p src/AuthService.Api/{Controllers,Extensions,Filters,Middlewares,ModelBinders,Models}
```

- **`Extensions/AuthenticationExtensions.cs`:** Configura `JwtBearer` con `ClockSkew = TimeSpan.Zero` y define `JwtBearerEvents.OnMessageReceived` para extraer el JWT desde la cookie `httpOnly` `kinal_access` cuando no se envía la cabecera `Authorization`.
- **`Filters/InternalServiceTokenAttribute.cs`:** Valida la cabecera `x-internal-token` contra `InternalServiceToken` en llamadas internas entre microservicios.
- **`Controllers/AuthController.cs` (`/api/v1/auth`):**
    - Emite y limpia las cookies `httpOnly` `kinal_access` y `kinal_refresh` en `login`, `refresh` y `logout`.
    - Expone `[AcceptVerbs("QUERY", "POST")]` en `profile/by-id` y `profile/by-username` protegidos con `[InternalServiceToken]`.
    - Expone `POST profile/picture` y el alias `POST profile/picture/avatar`.
    - Expone `GET users` restringido a `ADMIN_ROLE`.
- **`Controllers/UsersController.cs` (`/api/v1/users`):**
    - `PUT {userId}/role` (`ADMIN_ROLE`), `GET {userId}/roles` (valida que sea el propio usuario o `ADMIN_ROLE` para prevenir IDOR) y `GET by-role/{roleName}` (`ADMIN_ROLE`).

---

## Paso 7: Configuración de `appsettings.Development.json` y Ejecución

Crear `src/AuthService.Api/appsettings.Development.json` alineado con los puertos del monorepo:

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5435;Database=kinal_sports;Username=KinalSports;Password=KinalSports2027!"
    },
    "InternalServiceToken": "KinalSportsInternalSecretToken2026!",
    "JwtSettings": {
        "SecretKey": "MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!",
        "Issuer": "AuthService",
        "Audience": "AuthService",
        "ExpiryInMinutes": 15
    },
    "Seed": {
        "AdminPassword": "Admin1234!"
    },
    "Redis": {
        "ConnectionString": "redis://localhost:6379"
    },
    "AppSettings": {
        "FrontendUrl": "http://localhost:5173"
    }
}
```

### Compilar, probar y ejecutar

```bash
# Compilar toda la solución .NET 10
dotnet build AuthService.sln

# Ejecutar las 53 pruebas unitarias (Application.Tests + Infrastructure.Tests)
dotnet test AuthService.sln

# Iniciar la API en http://localhost:5156 (Swagger en http://localhost:5156/swagger)
dotnet run --project src/AuthService.Api
```
