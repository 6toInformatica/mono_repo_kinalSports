# Auth Node — Servicio de Autenticacion (Node.js + Fastify)

Microservicio de autenticacion y gestion de usuarios construido con **Fastify 5**, **TypeScript**, **Prisma 7** (PostgreSQL 18) y **Redis 7** siguiendo **Arquitectura Hexagonal (Puertos y Adaptadores)**.

---

## 1. Rol en la Arquitectura

- **En Desarrollo (`docker-compose.yml`):** Atiende el stack movil/usuario (`client-user` y `server-user`) en paralelo a `auth-service` (.NET 10), compartiendo la misma base de datos PostgreSQL y la misma instancia de Redis.
- **En Produccion (`docker-compose.prod.yml`):** En servidores donde no se dispone del runtime de Microsoft (.NET), `auth-node` asume el **100% de la autenticacion** de toda la plataforma (`client-admin`, `client-admin-next`, `client-user`, `server-admin` y `server-user`), inicializando por si mismo el esquema PostgreSQL, los roles base y el usuario administrador inicial.

---

## 2. Stack Tecnologico

- **Runtime y Framework:** Node.js 22.13+ (Node 26 en Docker), TypeScript 6, Fastify 5
- **Base de Datos y Caché:** PostgreSQL 18, Prisma 7 (`@prisma/adapter-pg`), Redis 7 (`Cache-Aside` con fallback a memoria)
- **Seguridad:** JWT (`HS256`), Cookies `httpOnly` (`kinal_access`, `kinal_refresh`), Argon2id, `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`
- **Integraciones:** Kinal Mail Hub (API REST) / SMTP (Nodemailer), Cloudinary (`@fastify/multipart`)
- **Validacion y Pruebas:** Zod 4, Vitest 5

---

## 3. Estructura del Proyecto

```
authentication-service/auth-node/
├── prisma/
│   └── schema.prisma               # Esquema Prisma sincronizado con PostgreSQL
├── src/
│   ├── main.ts                     # Punto de entrada: conexion BD, seed de roles/admin y arranque
│   ├── app.ts                      # Construccion de la instancia Fastify, plugins y /health
│   ├── container.ts                # Raiz de composicion (inyecta repositorios y adaptadores)
│   ├── config/
│   │   └── env.ts                  # Validacion estricta de variables de entorno con Zod
│   ├── http/
│   │   ├── cookies.ts              # Emision, lectura y limpieza de cookies httpOnly
│   │   ├── upload.ts               # Recepcion temporal de imagenes multipart
│   │   ├── hooks/                  # Hooks de autenticacion JWT (Bearer/cookie) y x-internal-token
│   │   └── plugins/                # CORS, Helmet, Rate Limit, Body Parsers y Error Handler
│   ├── infrastructure/
│   │   ├── cache/                  # Cliente Redis Cache-Aside (RESP2) con fallback en memoria
│   │   ├── database/               # Cliente Prisma + inicializacion autonoma del esquema SQL
│   │   ├── email/                  # Adaptadores Kinal Mail Hub (REST) y SMTP
│   │   ├── security/               # Argon2id y firma/verificacion de JWT
│   │   └── storage/                # Subida y borrado de avatares en Cloudinary
│   ├── shared/domain/              # Errores de dominio, generadores de IDs (`usr_...`) y tokens
│   └── modules/
│       ├── auth/                   # Casos de uso y rutas de registro, login, refresh, logout y reset
│       ├── users/                  # Casos de uso y rutas de perfil, foto, listado admin y QUERY interno
│       └── roles/                  # Casos de uso y rutas de asignacion y consulta de roles
├── .env.example
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp authentication-service/auth-node/.env.example authentication-service/auth-node/.env
pnpm --filter auth-node dev
```

### Opcion B: Como microservicio independiente (aislado)

```bash
cd authentication-service/auth-node
pnpm install
cp .env.example .env
pnpm dev
```

> **Inicializacion automatica de Base de Datos:** Al arrancar, `connectDatabase()` verifica si la tabla `users` existe en PostgreSQL. Si la base esta vacia, crea automaticamente todas las tablas, indices y llaves foraneas, siembra los roles `USER_ROLE` y `ADMIN_ROLE`, y crea el usuario `admin@ksports.local` (si `SEED_ADMIN_PASSWORD` esta definido).

---

## 5. Variables de Entorno (`.env`)

Copia `.env.example` a `.env`:

```env
NODE_ENV=development
PORT=3007

# PostgreSQL 18 (compartida con auth-service)
DB_HOST=localhost
DB_PORT=5435
DB_NAME=kinal_sports
DB_USERNAME=KinalSports
DB_PASSWORD=KinalSports2027!
DB_SQL_LOGGING=false

# JWT (debe coincidir con auth-service, server-admin y server-user)
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# Seguridad y comunicacion interna
INTERNAL_SERVICE_TOKEN=KinalSportsInternalSecretToken2026!
SEED_ADMIN_PASSWORD=Admin1234!
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Caché distribuida Redis (opcional; sin valor usa fallback en memoria)
REDIS_URL=redis://localhost:6379

# Correo (kmh o smtp)
MAIL_PROVIDER=kmh
KMH_API_BASE_URL=https://mail.lab.kinal.edu.gt
KMH_MAIL_FROM=kinal-sports@am-delta.in6am.mail.kinal.test
KMH_PROJECT_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=b3xvlule
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_BASE_URL=https://res.cloudinary.com/b3xvlule/image/upload/
CLOUDINARY_FOLDER=auth_service/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=avatarDefault-1749508519496_oam3k3
```

---

## 6. Scripts Disponibles

```bash
pnpm --filter auth-node dev             # Servidor de desarrollo con recarga (puerto 3007)
pnpm --filter auth-node build           # Genera cliente Prisma y compila TypeScript a dist/
pnpm --filter auth-node start           # Ejecuta la version compilada en dist/src/main.js
pnpm --filter auth-node test            # Ejecuta las pruebas unitarias con Vitest
pnpm --filter auth-node typecheck       # Verifica tipos sin emitir archivos
pnpm --filter auth-node lint            # Ejecuta ESLint
pnpm --filter auth-node prisma:pull     # Sincroniza schema.prisma desde PostgreSQL
pnpm --filter auth-node prisma:generate # Regenera el cliente Prisma en src/generated/
```

---

## 7. Decisiones de Seguridad y Rendimiento

1. **Soporte Dual de Sesion (Cookies `httpOnly` + JSON):**
   - En `/auth/login` y `/auth/refresh`, emite las cookies `httpOnly` `kinal_access` (15 min) y `kinal_refresh` (30 dias) para los paneles web (`client-admin` y `client-admin-next`), y devuelve el cuerpo JSON para clientes moviles (`client-user` con `expo-secure-store`).
   - El hook `authenticate` acepta el JWT desde `Authorization: Bearer <token>` o desde la cookie `kinal_access`.
2. **Caché `Cache-Aside` en Redis (`kinal:user:profile:<userId>`):**
   - `getProfile` almacena el perfil publico en Redis durante 60 segundos.
   - Al actualizar la foto de perfil (`updateProfilePicture`), cambiar el rol (`changeUserRole`) o verificar el correo (`verifyEmail`), se invalida inmediatamente la llave en Redis para que `server-admin` y `server-user` obtengan el perfil actualizado.
3. **Metodo HTTP `QUERY`:**
   - Las rutas internas `/auth/profile/by-id` y `/auth/profile/by-username` soportan el metodo seguro con body `QUERY` (ademas de `POST` por retrocompatibilidad).

---

## 8. Referencia de Endpoints

**Prefijo Base:** `/api/v1` | **Puerto:** `3007`

### Autenticacion y Perfil (`/api/v1/auth`)

| Metodo           | Endpoint                       | Descripcion                                        | Autenticacion                 |
| :--------------- | :----------------------------- | :------------------------------------------------- | :---------------------------- |
| `POST`           | `/auth/register`               | Registrar nuevo usuario (`multipart/form-data`)    | Publico                       |
| `POST`           | `/auth/verify-email`           | Confirmar correo con token                         | Publico                       |
| `POST`           | `/auth/resend-verification`    | Reenviar correo de verificacion                    | Publico                       |
| `POST`           | `/auth/login`                  | Iniciar sesion (emite JSON + cookies `httpOnly`)   | Publico                       |
| `POST`           | `/auth/refresh`                | Rotar refresh token y emitir nuevo access token    | Body o cookie `kinal_refresh` |
| `POST`           | `/auth/logout`                 | Revocar refresh token y limpiar cookies `httpOnly` | Body o cookie `kinal_refresh` |
| `POST`           | `/auth/forgot-password`        | Solicitar enlace de recuperacion                   | Publico                       |
| `POST`           | `/auth/reset-password`         | Restablecer contrasena y revocar sesiones          | Publico                       |
| `GET`            | `/auth/profile`                | Obtener perfil del usuario autenticado             | JWT (Bearer o `kinal_access`) |
| `POST`           | `/auth/profile/picture`        | Actualizar foto (`profilePicture` multipart)       | JWT (Bearer o `kinal_access`) |
| `POST`           | `/auth/profile/picture/avatar` | Alias para actualizar foto (`avatar` multipart)    | JWT (Bearer o `kinal_access`) |
| `GET`            | `/auth/users`                  | Listar todos los usuarios registrados              | JWT (`ADMIN_ROLE`)            |
| `QUERY` / `POST` | `/auth/profile/by-id`          | Obtener perfil por `userId` en el body             | Interno (`x-internal-token`)  |
| `QUERY` / `POST` | `/auth/profile/by-username`    | Obtener perfil por `username` en el body           | Interno (`x-internal-token`)  |

### Roles y Salud (`/api/v1/users` y `/api/v1/health`)

| Metodo | Endpoint                   | Descripcion                                            | Autenticacion                       |
| :----- | :------------------------- | :----------------------------------------------------- | :---------------------------------- |
| `PUT`  | `/users/:userId/role`      | Cambiar rol de un usuario (`ADMIN_ROLE` / `USER_ROLE`) | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/users/:userId/roles`     | Consultar roles de un usuario                          | JWT (Propio usuario o `ADMIN_ROLE`) |
| `GET`  | `/users/by-role/:roleName` | Listar usuarios que poseen un rol                      | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/health`                  | Estado del servicio y verificacion de PostgreSQL       | Publico                             |

### Ejemplos con `curl`

```bash
# Login
curl -i -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@ksports.local","password":"Admin1234!"}'

# Consulta interna de perfil usando el metodo HTTP QUERY
curl -X QUERY http://localhost:3007/api/v1/auth/profile/by-username \
  -H "x-internal-token: KinalSportsInternalSecretToken2026!" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```

---

## 9. Integracion con Otros Servicios

| Servicio                             | Relacion                                                                                      |
| :----------------------------------- | :-------------------------------------------------------------------------------------------- |
| `client-user`                        | Consume login, registro, refresh, logout y recuperacion de contrasena.                        |
| `client-admin` / `client-admin-next` | En produccion (`docker-compose.prod.yml`), consumen `auth-node` mediante cookies `httpOnly`.  |
| `server-user` / `server-admin`       | Validan los JWT emitidos y consultan perfiles via `QUERY /api/v1/auth/profile/by-id` y Redis. |
