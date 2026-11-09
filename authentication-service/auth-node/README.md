# Auth Node - Servicio de Autenticacion (Node.js)

API RESTful de autenticacion construida con Fastify, TypeScript, Prisma y PostgreSQL.

## Rol en la arquitectura

Servicio de autenticacion del **stack movil/usuario**:

- Consumido por **client-user** (login, registro, refresh)
- Validado por **server-user** (JWT)
- Paralelo a **auth-service** (.NET), que atiende el stack admin

Ambos servicios comparten PostgreSQL y emiten JWT con configuracion compatible.
Si uno cae, el otro puede atender a los mismos usuarios.

## Descripcion

Registro, login, gestion de perfiles, verificacion de email, recuperacion de contrasenas y administracion de roles. Usa JWT (access token de 15 min + refresh token rotativo de 30 dias) y Argon2id para hashing.

## Tech Stack

- **Node.js** 24+ (Docker usa Node 26), **TypeScript** 6, **Fastify** 5
- **PostgreSQL** + **Prisma** 7 (`@prisma/adapter-pg`)
- **JWT**, **Argon2id**, **Cloudinary**, **Nodemailer**
- **@fastify/helmet**, **@fastify/cors**, **@fastify/rate-limit**, **@fastify/multipart**
- **zod** para validar la configuracion al arrancar

### Esquema de base de datos

El esquema pertenece a las migraciones de EF Core de **auth-service** (servicio
`auth-migrator` en Docker). Este servicio **nunca** ejecuta `prisma migrate`:

- `pnpm prisma:pull` actualiza `prisma/schema.prisma` desde la base (conserva los nombres `@map`).
- `pnpm prisma:generate` genera el cliente en `src/generated/` (no se sube a Git; `pnpm dev` y `pnpm build` lo generan).

## Instalacion

```bash
pnpm install
cd authentication-service/auth-node
cp .env.example .env
pnpm dev
```

Desde la raiz:

```bash
pnpm --filter auth-node dev
```

## Variables de Entorno

Ver `.env.example`. Valores clave:

```env
NODE_ENV=development
PORT=3007
DB_HOST=localhost
DB_PORT=5435
DB_NAME=kinal_sports
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret-of-at-least-32-characters   # mismo que auth-service
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
FRONTEND_URL=http://localhost:5173
INTERNAL_SERVICE_TOKEN=your-internal-token
```

Si falta una variable obligatoria o el `JWT_SECRET` tiene menos de 32 caracteres,
el servicio no arranca e indica cual es.

## Estructura

```
auth-node/
├── prisma/schema.prisma        # obtenido con db pull (solo lectura del esquema)
└── src/
    ├── main.ts                 # arranque y apagado ordenado
    ├── app.ts                  # instancia de Fastify y plugins
    ├── container.ts            # raiz de composicion (une puertos e implementaciones)
    ├── config/env.ts           # configuracion validada con zod
    ├── http/                   # plugins, hooks, subida de archivos y validacion
    ├── infrastructure/         # Prisma, JWT, Argon2, SMTP, Cloudinary
    ├── shared/domain/          # errores tipados, ids, tokens seguros
    └── modules/
        ├── auth/               # registro, login, verificacion, recuperacion, sesion
        ├── users/              # perfil y foto
        └── roles/              # roles de usuario
```

Cada modulo tiene `domain/`, `application/` (puertos y casos de uso),
`infrastructure/` (repositorios Prisma) e `interface/http/` (rutas y handlers).

## Scripts

```bash
pnpm --filter auth-node dev        # desarrollo con recarga
pnpm --filter auth-node build      # compila a dist/
pnpm --filter auth-node start      # ejecuta dist/
pnpm --filter auth-node typecheck
pnpm --filter auth-node lint
```

## Endpoints

**Prefijo:** `/api/v1`  
**Puerto Docker:** `3007`  
**Health:** `GET /api/v1/health`

### Autenticacion (`/api/v1/auth`)

| Metodo | Endpoint                       | Descripcion                       | Auth                         |
| ------ | ------------------------------ | --------------------------------- | ---------------------------- |
| POST   | `/auth/refresh`                | Renovar access token              | No                           |
| POST   | `/auth/logout`                 | Cerrar sesion (invalidar refresh) | No                           |
| POST   | `/auth/register`               | Registrar usuario (multipart)     | No                           |
| POST   | `/auth/login`                  | Iniciar sesion                    | No                           |
| POST   | `/auth/verify-email`           | Verificar email                   | No                           |
| POST   | `/auth/resend-verification`    | Reenviar verificacion             | No                           |
| POST   | `/auth/forgot-password`        | Solicitar reset                   | No                           |
| POST   | `/auth/reset-password`         | Resetear contrasena               | No                           |
| GET    | `/auth/profile`                | Perfil del usuario autenticado    | JWT                          |
| POST   | `/auth/profile/picture`        | Actualizar foto (multipart)       | JWT                          |
| POST   | `/auth/profile/picture/avatar` | Alias de avatar (multipart)       | JWT                          |
| POST   | `/auth/profile/by-id`          | Perfil por userId                 | Interno (`x-internal-token`) |
| POST   | `/auth/profile/by-username`    | Perfil por username               | Interno (`x-internal-token`) |

### Usuarios / roles (`/api/v1/users`)

| Metodo | Endpoint                   | Descripcion      | Auth  |
| ------ | -------------------------- | ---------------- | ----- |
| PUT    | `/users/:userId/role`      | Actualizar rol   | Admin |
| GET    | `/users/:userId/roles`     | Roles de usuario | JWT   |
| GET    | `/users/by-role/:roleName` | Usuarios por rol | Admin |

## Ejemplos

**Registro:**

```bash
curl -X POST http://localhost:3007/api/v1/auth/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "password=SecurePass123!" \
  -F "name=John" \
  -F "surname=Doe" \
  -F "phone=12345678"
```

**Login:**

```bash
curl -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"john@example.com","password":"SecurePass123!"}'
```

**Perfil:**

```bash
curl http://localhost:3007/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

## Roles

- **USER_ROLE** (por defecto al registrarse)
- **ADMIN_ROLE** (administrador; no se puede quitar al ultimo)

## Dependencias

| Consumidor   | Uso                                          |
| ------------ | -------------------------------------------- |
| client-user  | Login, registro, refresh                     |
| server-user  | Validacion JWT y enriquecimiento de perfil   |
| server-admin | Enriquecimiento de perfil (consulta interna) |

## Autor

**Braulio Echeverria**

## Licencia

MIT
