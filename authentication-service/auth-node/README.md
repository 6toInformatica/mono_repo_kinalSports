# Auth Node — Microservicio de Autenticación (Node.js + Fastify)

## 1. Propósito del Componente

`auth-node` es el microservicio de identidad, autenticación y gestión de usuarios y roles basado en **Node.js**, **Fastify 5**, **TypeScript** y **Prisma 7** sobre **PostgreSQL 18**.

Su diseño demuestra cómo estructurar un servicio de autenticación bajo **Arquitectura Hexagonal (Puertos y Adaptadores)** que sea capaz de coexistir con otra implementación en un lenguaje distinto (`.NET 10`) compartiendo exactamente la misma base de datos relacional, el mismo esquema de caché en Redis y el mismo contrato criptográfico de tokens.

---

## 2. Responsabilidad dentro de KinalSports

- **En el entorno de desarrollo (`docker-compose.yml`):** Atiende el registro, inicio de sesión, rotación de _refresh tokens_, recuperación de contraseña y consulta de perfiles del ecosistema móvil (`client-user` y `server-user`), operando en paralelo con `auth-service` (`.NET 10`).
- **En el entorno de producción (`docker-compose.prod.yml`):** Asume el **100% de la autenticación de toda la plataforma** (clientes móviles, paneles web administrativos `client-admin` y `client-admin-next`, y consultas internas de `server-admin` y `server-user`), eliminando la dependencia del runtime de `.NET` en el servidor de despliegue.
- **Autonomía de inicialización:** Al iniciar (`connectDatabase()` en `src/infrastructure/database/prisma.ts`), verifica mediante `SELECT to_regclass('users')` si el esquema PostgreSQL existe; si la base está vacía, crea de forma idempotente todas las tablas, índices y llaves foráneas (`CANONICAL_SCHEMA_SQL`), registra los roles `USER_ROLE` y `ADMIN_ROLE` (`ensureRoles`) y crea el administrador inicial (`ensureInitialAdmin`).

---

## 3. Stack Tecnológico Verificado

| Categoría                    | Tecnología y Versión (`package.json`)                                                                                                | Uso en el Servicio                                                                                               |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Runtime**                  | Node.js `>= 22.13.0` (`node:26-slim` en Docker)                                                                                      | Ejecución sobre módulos ES (`"type": "module"`).                                                                 |
| **Framework HTTP**           | Fastify `^5.12.8` (`fastify-plugin` `^6.0.1`)                                                                                        | Servidor HTTP de baja sobrecarga, hooks de ciclo de vida y plugins encapsulados.                                 |
| **Lenguaje**                 | TypeScript `~6.0.3`                                                                                                                  | Tipado estático de casos de uso, puertos y adaptadores.                                                          |
| **ORM y Base de Datos**      | Prisma `7.10.1` + `@prisma/client` `7.10.1` + `@prisma/adapter-pg` `7.10.1`                                                          | Acceso tipado a PostgreSQL 18 y consultas SQL parametrizadas.                                                    |
| **Caché**                    | Cliente Redis `RESP2` propio (`src/infrastructure/cache/redis-cache.ts`)                                                             | Patrón `Cache-Aside` sobre Redis 7 con degradación automática a memoria local.                                   |
| **Seguridad y Criptografía** | `argon2` `^0.45.2`, `jsonwebtoken` `^9.0.3`, `@fastify/helmet` `^13.2.0`, `@fastify/cors` `^11.4.1`, `@fastify/rate-limit` `^11.2.2` | Hashing `Argon2id`, firma/verificación JWT (`HS256`), cookies `httpOnly`, cabeceras HTTP y límite de peticiones. |
| **Correo y Archivos**        | `nodemailer` `^10.4.0`, `cloudinary` `^2.11.0`, `@fastify/multipart` `^10.1.8`                                                       | Envío de correos vía API REST de Kinal Mail Hub o SMTP, y subida de avatares a Cloudinary.                       |
| **Validación y Pruebas**     | `zod` `^4.6.7`, `validator` `^13.15.35`, `vitest` `^5.1.0`                                                                           | Validación de variables de entorno, esquemas de entrada y pruebas unitarias con dobles en memoria.               |

---

## 4. Arquitectura Interna (Hexagonal: Puertos y Adaptadores)

El código separa estrictamente las reglas de aplicación de los detalles de infraestructura y transporte HTTP:

1. **Núcleo de Aplicación por Módulo (`src/modules/{auth,users,roles}/application/`):**
   - `ports.ts` y `deps.ts`: Definen los contratos (interfaces) que los casos de uso necesitan (`UserRepository`, `RoleRepository`, `RefreshTokenRepository`, `PasswordHasher`, `TokenSigner`, `MailSender`, `AvatarStorage`, `CachePort`).
   - `use-cases/*.ts`: Funciones fábrica puras (`makeLogin`, `makeRegisterUser`, `makeRefreshAccessToken`, `makeGetUserProfile`, `makeChangeUserRole`, etc.) que reciben sus dependencias por inyección explícita sin importar Fastify, Prisma ni Cloudinary.
2. **Adaptadores de Entrada — Interfaz HTTP (`src/modules/*/interface/http/` y `src/http/`):**
   - Traducen peticiones Fastify (`request`, `reply`), validan cuerpos y parámetros con esquemas Zod, gestionan las cookies `httpOnly` (`kinal_access` y `kinal_refresh` en `src/http/cookies.ts`) y delegan la ejecución al caso de uso correspondiente.
3. **Adaptadores de Salida — Infraestructura (`src/infrastructure/` y `src/modules/*/infrastructure/`):**
   - `prisma-*.repository.ts`: Implementan los puertos de persistencia traduciendo entre modelos de Prisma y entidades de dominio.
   - `cache/redis-cache.ts`: Implementa el puerto de caché (`get`, `set`, `del`, `delByPrefix`) contra Redis o memoria local.
   - `email/kmh-mail.sender.ts` y `smtp-mail.sender.ts`: Implementan el puerto `MailSender`.
   - `security/argon2-hasher.ts` y `jwt-signer.ts`: Implementan el hashing Argon2id y la emisión/verificación de JWT.
   - `storage/cloudinary.storage.ts`: Implementa la subida y eliminación de imágenes de perfil.
4. **Raíz de Composición (`src/container.ts`):**
   - Ensambla los repositorios, adaptadores e instancias de casos de uso en un único contenedor inyectado en `buildApp()` (`src/app.ts`).

---

## 5. Estructura Principal del Directorio

```text
authentication-service/auth-node/
├── prisma/
│   └── schema.prisma               # Esquema de base de datos PostgreSQL para Prisma 7
├── src/
│   ├── main.ts                     # Punto de entrada: conexión a BD, seed inicial y arranque del servidor
│   ├── app.ts                      # Configuración de Fastify, registro de plugins, rutas y GET /api/v1/health
│   ├── container.ts                # Inyección manual de dependencias (Composition Root)
│   ├── config/
│   │   └── env.ts                  # Validación de variables de entorno con Zod
│   ├── http/
│   │   ├── cookies.ts              # Emisión, lectura y limpieza de cookies httpOnly (kinal_access, kinal_refresh)
│   │   ├── upload.ts               # Procesamiento multipart para imágenes de perfil
│   │   ├── hooks/                  # authenticate (Bearer o cookie) y requireInternalToken (x-internal-token)
│   │   └── plugins/                # CORS, Helmet, Rate Limit, Body Parsers y manejador central de errores
│   ├── infrastructure/
│   │   ├── cache/                  # Cliente Redis Cache-Aside (redis-cache.ts) y pruebas unitarias
│   │   ├── database/               # Cliente Prisma, inicialización SQL autónoma y healthcheck
│   │   ├── email/                  # Adaptadores de correo Kinal Mail Hub (REST) y SMTP (Nodemailer)
│   │   ├── security/               # Argon2id y firma/verificación de JWT
│   │   └── storage/                # Adaptador de Cloudinary
│   ├── modules/
│   │   ├── auth/                   # Registro, login, refresh, logout, verificación de correo y reset de contraseña
│   │   ├── users/                  # Perfil propio, cambio de foto, listado admin y consultas internas (QUERY/POST)
│   │   └── roles/                  # Consulta y actualización de roles de usuario
│   ├── shared/domain/              # Errores de dominio, generadores de IDs (usr_..., rol_...) y tokens
│   └── test/                       # Dobles de prueba en memoria (fakes.ts) para tests unitarios
├── .env.example
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Requisitos

- **Node.js:** `>= 22.13.0`
- **pnpm:** `>= 10`
- **PostgreSQL:** `18` (accesible en el host/puerto configurado en `DB_HOST` y `DB_PORT`)
- **Redis:** `7+` (opcional en desarrollo local; si `REDIS_URL` se omite o no responde, opera con caché en memoria)

---

## 7. Configuración de Variables de Entorno

Crea el archivo `authentication-service/auth-node/.env` a partir de `.env.example`:

```bash
cp authentication-service/auth-node/.env.example authentication-service/auth-node/.env
```

Variables principales verificadas en `src/config/env.ts`:

| Variable                                                                 | Requerida             | Valor de Referencia (Local)                                         | Descripción                                                                                                            |
| :----------------------------------------------------------------------- | :-------------------- | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                               | No                    | `development`                                                       | Entorno de ejecución (`development`, `test`, `production`). En `production` activa `Secure` en las cookies `httpOnly`. |
| `PORT`                                                                   | No                    | `3007`                                                              | Puerto HTTP en el que escucha Fastify.                                                                                 |
| `DB_HOST` / `DB_PORT`                                                    | Sí                    | `localhost` / `5435`                                                | Host y puerto de PostgreSQL (`5435` mapeado por Docker, `5432` interno).                                               |
| `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD`                                | Sí                    | `kinal_sports` / `KinalSports` / `...`                              | Credenciales de conexión a PostgreSQL.                                                                                 |
| `JWT_SECRET`                                                             | Sí                    | _(mínimo 32 caracteres)_                                            | Clave simétrica `HS256`. Debe coincidir con `auth-service`, `server-admin` y `server-user`.                            |
| `JWT_ISSUER` / `JWT_AUDIENCE`                                            | No                    | `AuthService` / `AuthService`                                       | Emisor y audiencia validados en cada token.                                                                            |
| `INTERNAL_SERVICE_TOKEN`                                                 | Sí (en uso interno)   | _(secreto compartido)_                                              | Token validado en la cabecera `x-internal-token` para `/auth/profile/by-id` y `/by-username`.                          |
| `SEED_ADMIN_PASSWORD`                                                    | No                    | _(contraseña segura)_                                               | Si se define y la tabla `users` está vacía, crea el usuario `admin@ksports.local` con `ADMIN_ROLE`.                    |
| `REDIS_URL`                                                              | No                    | `redis://localhost:6379`                                            | URL de conexión a Redis para caché `Cache-Aside`.                                                                      |
| `ALLOWED_ORIGINS`                                                        | No                    | `http://localhost:3000,http://localhost:3001,http://localhost:5173` | Orígenes habilitados en CORS con `credentials: true`.                                                                  |
| `FRONTEND_URL`                                                           | No                    | `http://localhost:5173`                                             | URL base utilizada en los enlaces de verificación y recuperación enviados por correo.                                  |
| `MAIL_PROVIDER`                                                          | No                    | `kmh`                                                               | Proveedor de correo: `kmh` (Kinal Mail Hub REST API) o `smtp`.                                                         |
| `KMH_API_BASE_URL` / `KMH_MAIL_FROM` / `KMH_PROJECT_API_KEY`             | Según `MAIL_PROVIDER` | `https://mail.lab.kinal.edu.gt`                                     | Configuración de Kinal Mail Hub. Nunca versionar `KMH_PROJECT_API_KEY`.                                                |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Sí                    | _(credenciales Cloudinary)_                                         | Configuración para almacenamiento de imágenes de perfil.                                                               |

---

## 8. Ejecución Local

### Desde la raíz del monorepo

```bash
pnpm --filter auth-node dev
```

### Desde el directorio del servicio

```bash
cd authentication-service/auth-node
pnpm install
pnpm dev
```

### Todos los scripts de `package.json`

- `pnpm dev`: Inicia el servidor en modo desarrollo con recarga automática (`nodemon`).
- `pnpm build`: Ejecuta `prisma generate && tsc -p tsconfig.build.json` generando la salida en `dist/`.
- `pnpm start`: Ejecuta la versión compilada (`node dist/src/main.js`).
- `pnpm typecheck`: Verifica tipos con `tsc --noEmit`.
- `pnpm lint` / `pnpm lint:fix`: Analiza el código con ESLint.
- `pnpm format`: Formatea el código con Prettier.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Ejecuta la suite de pruebas unitarias con Vitest.
- `pnpm prisma:pull` / `pnpm prisma:generate`: Introspecciona la base PostgreSQL o regenera el cliente Prisma en `src/generated/prisma`.

---

## 9. Integraciones y Referencia de Endpoints

**Prefijo base:** `/api/v1`

### 9.1 Endpoints de Autenticación y Perfil (`/api/v1/auth`)

| Método           | Ruta                           | Descripción                                                                                                             | Autenticación                          |
| :--------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `POST`           | `/auth/register`               | Registro de usuario (`multipart/form-data`, campo opcional `profilePicture`).                                           | Público (Rate Limit Auth)              |
| `POST`           | `/auth/verify-email`           | Confirma el correo electrónico con `{ token }` e invalida caché de perfil.                                              | Público (Rate Limit Auth)              |
| `POST`           | `/auth/resend-verification`    | Reenvía el correo de verificación para cuentas no verificadas.                                                          | Público (Rate Limit Auth)              |
| `POST`           | `/auth/login`                  | Valida credenciales, devuelve JWT + `refreshToken` en JSON y fija cookies `httpOnly` (`kinal_access`, `kinal_refresh`). | Público (Rate Limit Auth)              |
| `POST`           | `/auth/refresh`                | Rota el `refreshToken` (leído del body JSON o de la cookie `kinal_refresh`) y emite un nuevo `accessToken`.             | Body o cookie `kinal_refresh`          |
| `POST`           | `/auth/logout`                 | Revoca el `refreshToken` en PostgreSQL y limpia las cookies `httpOnly`.                                                 | Body o cookie `kinal_refresh`          |
| `POST`           | `/auth/forgot-password`        | Genera token de recuperación y envía enlace por correo.                                                                 | Público (Rate Limit Auth)              |
| `POST`           | `/auth/reset-password`         | Actualiza contraseña con `{ token, newPassword }` y revoca las sesiones activas.                                        | Público (Rate Limit Auth)              |
| `GET`            | `/auth/profile`                | Devuelve el perfil del usuario autenticado (respaldado en Redis `kinal:user:profile:<id>`).                             | JWT (`Bearer` o cookie `kinal_access`) |
| `POST`           | `/auth/profile/picture`        | Actualiza la fotografía de perfil (campo `profilePicture`) e invalida caché en Redis.                                   | JWT (`Bearer` o cookie `kinal_access`) |
| `POST`           | `/auth/profile/picture/avatar` | Alias compatible con `server-user` y `.NET` para actualizar avatar (campo `avatar`).                                    | JWT (`Bearer` o cookie `kinal_access`) |
| `GET`            | `/auth/users`                  | Lista todos los usuarios registrados con sus perfiles y roles.                                                          | JWT (`ADMIN_ROLE`)                     |
| `QUERY` / `POST` | `/auth/profile/by-id`          | Consulta interna de perfil enviando `{ userId }` en el cuerpo JSON.                                                     | Cabecera `x-internal-token`            |
| `QUERY` / `POST` | `/auth/profile/by-username`    | Consulta interna de perfil enviando `{ username }` en el cuerpo JSON.                                                   | Cabecera `x-internal-token`            |

### 9.2 Endpoints de Roles y Salud (`/api/v1/users` y `/api/v1/health`)

| Método | Ruta                       | Descripción                                                                                    | Autenticación                       |
| :----- | :------------------------- | :--------------------------------------------------------------------------------------------- | :---------------------------------- |
| `PUT`  | `/users/:userId/role`      | Asigna un nuevo rol (`ADMIN_ROLE` o `USER_ROLE`) e invalida la caché del usuario en Redis.     | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/users/:userId/roles`     | Obtiene la lista de roles asignados a un usuario (protegido contra IDOR).                      | JWT (Propio usuario o `ADMIN_ROLE`) |
| `GET`  | `/users/by-role/:roleName` | Lista todos los usuarios que poseen el rol indicado.                                           | JWT (`ADMIN_ROLE`)                  |
| `GET`  | `/health`                  | Verifica el estado del servicio y ejecuta `SELECT 1` contra PostgreSQL (`503` si la BD falla). | Público                             |

---

## 10. Pruebas

Las pruebas unitarias (`src/**/*.test.ts`) se ejecutan con **Vitest** sin necesidad de levantar PostgreSQL ni Redis, apoyándose en los dobles de prueba de `src/test/fakes.ts`:

```bash
pnpm --filter auth-node test
```

Incluyen pruebas para:

- Casos de uso de registro, login, rotación y detección de reúso de _refresh tokens_, verificación de correo, cambio de contraseña y cambio de roles.
- Cliente Redis `Cache-Aside` (`src/infrastructure/cache/redis-cache.test.ts`), verificando almacenamiento, expiración TTL, borrado por prefijo y fallback en memoria.
- Adaptador HTTP de Kinal Mail Hub y utilidades de dominio.

---

## 11. Build, Despliegue en Docker y Limitaciones Relevantes

### 11.1 Construcción Multi-Etapa en Docker

El archivo `dockerfiles/Dockerfile.auth-node` define una construcción multi-etapa sobre `node:26-slim`:

- **Etapa `dev`:** Instala dependencias con `pnpm install --frozen-lockfile` y ejecuta `nodemon --legacy-watch` en el puerto `3007` (usada en `docker-compose.yml`).
- **Etapa `runtime`:** Compila TypeScript + cliente Prisma (`pnpm build`), instala únicamente dependencias de producción (`pnpm install --frozen-lockfile --prod`), asigna permisos sobre `./uploads` al usuario sin privilegios `node` y ejecuta `node dist/src/main.js` (usada en `docker-compose.prod.yml`).

### 11.2 Limitaciones y Consideraciones Operativas

- **Sincronización de esquema con `auth-service`:** El SQL de inicialización autónoma (`CANONICAL_SCHEMA_SQL` en `src/infrastructure/database/prisma.ts`) y `prisma/schema.prisma` deben mantenerse alineados con las migraciones de EF Core de `auth-service`.
- **Resolución DNS de Kinal Mail Hub:** El dominio `mail.lab.kinal.edu.gt` pertenece a la red interna del laboratorio; fuera de ella requiere mapear `extra_hosts` en Docker o conmutar `MAIL_PROVIDER=smtp`.
- **Diferencias de código HTTP frente a `.NET`:** En casos puntuales de error (como registro duplicado `409` frente a `400` en `.NET`), ambos servicios mantienen sus contratos documentados en `tests/contract`.

---

## 12. Documentación Relacionada

- [README Principal del Monorepo](../../README.md)
- [Arquitectura Detallada del Sistema](../../docs/ARCHITECTURE.md)
- [Auth Service (.NET 10) — Implementación paralela](../auth-service/README.md)
- [Server User — Consumidor principal en desarrollo](../../server-user/README.md)
- [Server Admin — Consumidor administrativo](../../server-admin/README.md)
- [Pruebas de Contrato HTTP](../../tests/contract/README.md)
