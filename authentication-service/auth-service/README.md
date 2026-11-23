# Auth Service — Servicio de Autenticacion (.NET 10)

Microservicio de autenticacion y gestion de usuarios construido con **ASP.NET Core 10**, **Entity Framework Core 10**, **PostgreSQL 18** y **Redis 7** siguiendo **Clean Architecture**.

---

## 1. Rol en la Arquitectura y en el Ciclo Educativo

- **En Desarrollo y Clase (`docker-compose.yml`):** Atiende el stack administrativo (`client-admin`, `client-admin-next` y `server-admin`) y sirve como referencia didactica de **Clean Architecture en .NET 10**.
- **Paridad con `auth-node`:** Comparte la misma base de datos PostgreSQL 18, la misma caché en Redis (`kinal:user:profile:<id>`), los mismos parametros Argon2id y el mismo contrato HTTP/JWT que `auth-node`.
- **Nota sobre Produccion (`docker-compose.prod.yml`):** Dado que el servidor de produccion no cuenta con runtime de Microsoft (.NET), en produccion `auth-node` asume el 100% del trafico sin requerir cambios en los clientes ni en la base de datos.

---

## 2. Stack Tecnologico

- **Framework y Runtime:** .NET 10 (`net10.0`), ASP.NET Core 10 Web API
- **Persistencia y Caché:** Entity Framework Core 10 (`Npgsql`), PostgreSQL 18, Redis 7 (`RedisCacheService` con fallback a memoria)
- **Seguridad:** JWT Bearer (`HS256`), Cookies `httpOnly` (`kinal_access`, `kinal_refresh`), Argon2id (`Konscious.Security.Cryptography`), Rate Limiting nativo, NetEscapades Security Headers
- **Integraciones y Logging:** Kinal Mail Hub (REST) / MailKit (SMTP), Cloudinary, Serilog
- **Pruebas:** xUnit v3 (`Microsoft.Testing.Platform`) y NSubstitute

---

## 3. Estructura del Proyecto (Clean Architecture)

```
authentication-service/auth-service/
├── AuthService.sln
├── global.json                             # SDK .NET 10.0.x (rollForward: latestFeature)
├── src/
│   ├── AuthService.Domain/                 # Entidades (User, Role, RefreshToken...), constantes e interfaces de repositorio
│   ├── AuthService.Application/            # Casos de uso (AuthService, UserManagementService, RefreshTokenService), DTOs y validadores
│   ├── AuthService.Infrastructure/         # Adaptadores externos: JWT, Argon2id, RedisCacheService, KMH/SMTP y Cloudinary
│   ├── AuthService.Persistence/            # ApplicationDbContext, Migraciones EF Core, Repositorios y DataSeeder
│   └── AuthService.Api/                    # Controllers (Auth, Users, Health), Middlewares, Filters y Program.cs
└── tests/
    ├── AuthService.Application.Tests/      # Pruebas unitarias de casos de uso y validadores
    └── AuthService.Infrastructure.Tests/   # Pruebas unitarias de JWT, Argon2id, RedisCacheService y KMH
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
cp authentication-service/auth-service/src/AuthService.Api/appsettings.Development.example.json \
   authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json
pnpm --filter auth-service dev
```

### Opcion B: Directamente con `.NET CLI`

```bash
cd authentication-service/auth-service
dotnet restore
dotnet run --project src/AuthService.Api
```

> Al iniciar, `Program.cs` ejecuta automaticamente las migraciones pendientes de EF Core y siembra los roles (`USER_ROLE`, `ADMIN_ROLE`) y el administrador inicial (`admin@ksports.local`).

---

## 5. Configuracion (`appsettings.Development.json` / Variables de Entorno)

Edita `src/AuthService.Api/appsettings.Development.json` (no versionado):

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5435;Database=kinal_sports;Username=KinalSports;Password=KinalSports2027!"
    },
    "JwtSettings": {
        "SecretKey": "MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!",
        "Issuer": "AuthService",
        "Audience": "AuthService",
        "ExpiryInMinutes": 15
    },
    "InternalServiceToken": "KinalSportsInternalSecretToken2026!",
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

---

## 6. Scripts y Comandos Disponibles

```bash
pnpm --filter auth-service dev      # Ejecuta con recarga en caliente (dotnet watch) en puerto 5156
pnpm --filter auth-service build    # Compila la solucion completa
pnpm --filter auth-service start    # Ejecuta AuthService.Api
pnpm --filter auth-service test     # Ejecuta las 53 pruebas unitarias (xUnit v3)
pnpm --filter auth-service format   # Formatea el codigo C# con dotnet format
pnpm --filter auth-service clean    # Limpia artefactos de compilacion

# Comandos de migraciones EF Core (desde authentication-service/auth-service)
dotnet ef migrations add <Nombre> --project src/AuthService.Persistence --startup-project src/AuthService.Api
dotnet ef database update --project src/AuthService.Persistence --startup-project src/AuthService.Api
```

---

## 7. Decisiones de Seguridad y Rendimiento

1. **Cookies `httpOnly` + Bearer JWT:**
    - `AuthController` emite `kinal_access` y `kinal_refresh` (`HttpOnly`, `SameSite=Lax`) en `/auth/login` y `/auth/refresh`, y las elimina en `/auth/logout`.
    - `AuthenticationExtensions` (`JwtBearerEvents.OnMessageReceived`) lee automaticamente la cookie `kinal_access` cuando la peticion no trae header `Authorization`.
2. **Caché Distribuida `Cache-Aside` (`RedisCacheService`):**
    - `GetUserByIdAsync` consulta primero `kinal:user:profile:{userId}` en Redis (TTL 60 s) e invalida la llave al actualizar foto de perfil, verificar correo o cambiar el rol del usuario.
3. **Metodo HTTP `QUERY`:**
    - `GetProfileById` y `GetProfileByUsername` usan `[AcceptVerbs("QUERY", "POST")]` protegidos por `[InternalServiceToken]`.

---

## 8. Referencia de Endpoints

**URL Base:** `http://localhost:5156/api/v1` | **Swagger (Dev):** `http://localhost:5156/swagger`

### Autenticacion y Perfil (`/api/v1/auth`)

| Metodo           | Endpoint                       | Descripcion                                | Autenticacion                 |
| :--------------- | :----------------------------- | :----------------------------------------- | :---------------------------- |
| `POST`           | `/auth/register`               | Registrar usuario (`multipart/form-data`)  | Publico                       |
| `POST`           | `/auth/verify-email`           | Verificar correo electronico               | Publico                       |
| `POST`           | `/auth/resend-verification`    | Reenviar correo de verificacion            | Publico                       |
| `POST`           | `/auth/login`                  | Iniciar sesion (JSON + cookies `httpOnly`) | Publico                       |
| `POST`           | `/auth/refresh`                | Rotar refresh token                        | Body o cookie `kinal_refresh` |
| `POST`           | `/auth/logout`                 | Revocar refresh token y limpiar cookies    | Body o cookie `kinal_refresh` |
| `POST`           | `/auth/forgot-password`        | Solicitar enlace de recuperacion           | Publico                       |
| `POST`           | `/auth/reset-password`         | Restablecer contrasena                     | Publico                       |
| `GET`            | `/auth/profile`                | Obtener perfil propio                      | JWT (Bearer o `kinal_access`) |
| `POST`           | `/auth/profile/picture`        | Actualizar foto (`profilePicture`)         | JWT (Bearer o `kinal_access`) |
| `POST`           | `/auth/profile/picture/avatar` | Alias para actualizar foto (`avatar`)      | JWT (Bearer o `kinal_access`) |
| `GET`            | `/auth/users`                  | Listar todos los usuarios                  | JWT (`ADMIN_ROLE`)            |
| `QUERY` / `POST` | `/auth/profile/by-id`          | Obtener perfil por `userId` (body)         | Interno (`x-internal-token`)  |
| `QUERY` / `POST` | `/auth/profile/by-username`    | Obtener perfil por `username` (body)       | Interno (`x-internal-token`)  |

### Roles y Salud (`/api/v1/users` y `/health`)

| Metodo | Endpoint                     | Descripcion                  | Autenticacion                       |
| :----- | :--------------------------- | :--------------------------- | :---------------------------------- |
| `PUT`  | `/users/{userId}/role`       | Cambiar rol de usuario       | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/users/{userId}/roles`      | Consultar roles del usuario  | JWT (Propio usuario o `ADMIN_ROLE`) |
| `GET`  | `/users/by-role/{roleName}`  | Listar usuarios por rol      | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/health` o `/api/v1/health` | Estado de salud del servicio | Publico                             |

---

## 9. Guias Didacticas Complementarias

- [GUIA_RAPIDA.md](./GUIA_RAPIDA.md) — Resumen de comandos y arquitectura para clase.
- [FLUJO_RECREACION_PASO_A_PASO.md](./FLUJO_RECREACION_PASO_A_PASO.md) — Guia detallada para construir la solucion paso a paso en clase.
