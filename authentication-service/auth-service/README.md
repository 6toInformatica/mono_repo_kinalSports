# Auth Service - Servicio de Autenticacion (.NET)

API RESTful de autenticacion construida con ASP.NET Core 8 y PostgreSQL (Clean Architecture).

## Rol en la arquitectura

Servicio de autenticacion del **stack admin**:

- Consumido por **client-admin** (login, registro, usuarios)
- Validado por **server-admin** (JWT via `AUTH_SERVICE_URL`)
- Paralelo a **auth-node** (Node), que atiende el stack movil/usuario

Ambos servicios comparten PostgreSQL.

## Descripcion

Registro, login, refresh tokens, gestion de perfiles, verificacion de email, recuperacion de contrasenas y administracion de roles/usuarios.

## Tech Stack

- **ASP.NET Core** 8.0, **Entity Framework Core**, **PostgreSQL**
- **JWT Bearer**, **PBKDF2** (Identity), **Cloudinary**, **SMTP**
- **FluentValidation**, Rate Limiting, CORS

## Arquitectura

```
src/
├── AuthService.Api/           # Controllers, Program.cs, Middlewares
├── AuthService.Application/   # Services, DTOs, Validators
├── AuthService.Domain/        # Entities, Enums
└── AuthService.Persistence/   # DbContext, Migrations, Repositories
```

Controllers activos:

- `AuthController` — autenticacion y perfil
- `UsersController` — roles de usuario
- `HealthController` — health check
- `UserController` — stub vacio (no usar)

## Instalacion

```bash
cd authentication-service/auth-service
dotnet restore
pnpm --filter auth-service dev
```

## Configuracion

Editar `src/AuthService.Api/appsettings.Development.json` o variables de entorno en Docker:

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5435;Database=kinal_sports;Username=IN6AV;Password=In6av2026!"
    },
    "JwtSettings": {
        "SecretKey": "MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!",
        "Issuer": "AuthService",
        "Audience": "AuthService"
    }
}
```

**Puerto:** `5156` (launchSettings + Docker Compose)  
**URL base API:** `http://localhost:5156/api/v1`

## Scripts

```bash
pnpm --filter auth-service dev      # dotnet watch
pnpm --filter auth-service build
pnpm --filter auth-service start
pnpm --filter auth-service format
pnpm --filter auth-service clean
```

## Migraciones

```bash
dotnet ef migrations add MigrationName \
  --project src/AuthService.Persistence \
  --startup-project src/AuthService.Api

dotnet ef database update \
  --project src/AuthService.Persistence \
  --startup-project src/AuthService.Api
```

## Endpoints

### Autenticacion (`/api/v1/auth`)

| Metodo | Endpoint                    | Descripcion           | Auth  |
| ------ | --------------------------- | --------------------- | ----- |
| POST   | `/auth/refresh`             | Renovar token         | No    |
| POST   | `/auth/logout`              | Cerrar sesion         | JWT   |
| GET    | `/auth/profile`             | Perfil autenticado    | JWT   |
| POST   | `/auth/profile/by-username` | Perfil por username   | No    |
| POST   | `/auth/profile/by-id`       | Perfil por userId     | No    |
| POST   | `/auth/register`            | Registrar usuario     | No    |
| POST   | `/auth/login`               | Iniciar sesion        | No    |
| POST   | `/auth/verify-email`        | Verificar email       | No    |
| POST   | `/auth/resend-verification` | Reenviar verificacion | No    |
| POST   | `/auth/forgot-password`     | Solicitar reset       | No    |
| POST   | `/auth/reset-password`      | Resetear contrasena   | No    |
| POST   | `/auth/profile/picture`     | Actualizar foto       | JWT   |
| GET    | `/auth/users`               | Listar usuarios       | Admin |

### Usuarios (`/api/v1/users`) — UsersController

| Metodo | Endpoint                    | Descripcion      | Auth  |
| ------ | --------------------------- | ---------------- | ----- |
| PUT    | `/users/{userId}/role`      | Actualizar rol   | Admin |
| GET    | `/users/{userId}/roles`     | Roles de usuario | Admin |
| GET    | `/users/by-role/{roleName}` | Usuarios por rol | Admin |

### Health

| Metodo | Endpoint         | Descripcion         |
| ------ | ---------------- | ------------------- |
| GET    | `/health`        | Estado del servicio |
| GET    | `/api/v1/health` | Health alternativo  |

## Ejemplo Login

```bash
curl -X POST http://localhost:5156/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"john@example.com","password":"SecurePass123!"}'
```

Respuesta tipica:

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresAt": "2026-06-16T12:00:00Z",
    "user": {
        "id": "uuid",
        "username": "johndoe",
        "email": "john@example.com",
        "roles": ["USER"]
    }
}
```

## Dependencias

| Consumidor   | Uso                                    |
| ------------ | -------------------------------------- |
| client-admin | Autenticacion y gestion de usuarios    |
| server-admin | Validacion JWT (`utils/authClient.js`) |

## Testing

Proyecto de tests no incluido actualmente en la solucion. Seccion pendiente de implementacion.

## Guias de recreacion

Para reconstruir AuthService desde cero (fines educativos):

- [GUIA_RAPIDA.md](./GUIA_RAPIDA.md)
- [FLUJO_RECREACION_PASO_A_PASO.md](./FLUJO_RECREACION_PASO_A_PASO.md)

Para operar el monorepo existente, usa este README y el [README raiz](../../README.md).

## Autor

**Braulio Echeverria**

## Licencia

MIT
