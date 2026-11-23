# Server Admin — API de Administracion (NestJS)

Microservicio administrativo para la plataforma KinalSports construido con **NestJS 12**, **TypeScript**, **MongoDB 7 (Mongoose 9)** y **Redis 7**.

---

## 1. Rol en la Arquitectura

- Gestiona el ciclo de vida administrativo de **canchas deportivas**, **reservaciones**, **equipos** y **torneos**.
- Es consumido por los dos paneles administrativos web (`client-admin` y `client-admin-next`) mediante JWT (por header o cookie `httpOnly` `kinal_access`) y expone lecturas internas a `server-user` mediante `x-internal-token`.
- Enriquece las reservaciones consultando los perfiles de usuario en el servicio de autenticacion (`QUERY /api/v1/auth/profile/by-id`) a traves de la caché distribuida en Redis.

---

## 2. Stack Tecnologico

- **Runtime y Framework:** Node.js 22.13+ (Node 26 en Docker), TypeScript 6, NestJS 12 (`@nestjs/platform-express`)
- **Base de Datos y Caché:** MongoDB 7, Mongoose 9 (`@nestjs/mongoose`), Redis 7 (`RedisCacheService` con fallback a memoria)
- **Seguridad:** `JwtAuthGuard` (`HS256`), `RolesGuard` (`ADMIN_ROLE`), `AuthOrInternalGuard`, Helmet 8, `express-rate-limit`
- **Archivos y Validacion:** Multer + Cloudinary, Zod 4 (validacion de entorno), `ObjectIdPipe`
- **Pruebas:** Vitest 5 + `@swc/core`

---

## 3. Estructura del Proyecto

```
server-admin/
├── src/
│   ├── main.ts                     # Bootstrap: CORS, Helmet, Rate Limit, prefijo global y apagado ordenado
│   ├── app.module.ts               # Modulo raiz: Config, Mongoose, CacheModule, Security e Integrations
│   ├── config/
│   │   ├── env.validation.ts       # Esquema Zod de variables de entorno
│   │   └── http.config.ts          # Configuracion de Helmet, Rate Limit y fallback 404
│   ├── common/
│   │   ├── cache/                  # RedisCacheService (Cache-Aside + invalidacion por prefijo)
│   │   ├── filters/                # Filtro global de excepciones (formato JSON uniforme)
│   │   ├── pipes/                  # ObjectIdPipe para validar IDs de MongoDB (400 Bad Request)
│   │   ├── security/               # TokenService (Bearer, x-token y cookie kinal_access) y Guards
│   │   ├── upload/                 # Interceptor de subida de imagenes en memoria
│   │   └── validation/             # Reglas declarativas de validacion de body
│   ├── integrations/
│   │   ├── auth-client.service.ts  # Cliente interno hacia auth (QUERY profile/by-id + caché Redis)
│   │   └── cloudinary.service.ts   # Subida y eliminacion segura de imagenes en Cloudinary
│   ├── health/                     # GET /health (verifica readyState de MongoDB)
│   ├── fields/                     # CRUD de canchas, soporte QUERY y caché Cache-Aside
│   ├── reservations/               # Listado, detalle, confirmacion y cancelacion de reservas
│   ├── teams/                      # CRUD de equipos, cambio de manager y miembros nombrados
│   └── tournaments/                # CRUD y activacion/desactivacion de torneos
├── .env.example
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp server-admin/.env.example server-admin/.env
pnpm --filter server-admin dev
```

### Opcion B: Como microservicio independiente (aislado)

```bash
cd server-admin
pnpm install
cp .env.example .env
pnpm dev
```

---

## 5. Variables de Entorno (`.env`)

Copia `.env.example` a `.env`:

```env
NODE_ENV=development
PORT=3009

# MongoDB (compartida con server-user)
URI_MONGODB=mongodb://localhost:27020/kinalSports

# JWT (debe coincidir con auth-service y auth-node)
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# Comunicacion interna y Caché Redis
AUTH_SERVICE_URL=http://localhost:5156/api/v1
INTERNAL_SERVICE_TOKEN=KinalSportsInternalSecretToken2026!
REDIS_URL=redis://localhost:6379

# CORS del panel administrativo
ADMIN_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=b3xvlule
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=kinal_sports/fields
CLOUDINARY_TEAMS_FOLDER=kinal_sports/teams
CLOUDINARY_TOURNAMENTS_FOLDER=kinal_sports/tournaments
```

> En produccion (`docker-compose.prod.yml`), `AUTH_SERVICE_URL` apunta a `http://auth-node:3007/api/v1`.

---

## 6. Scripts Disponibles

```bash
pnpm --filter server-admin dev         # Desarrollo con recarga en puerto 3009
pnpm --filter server-admin build       # Compila TypeScript a dist/
pnpm --filter server-admin start       # Ejecuta dist/main.js
pnpm --filter server-admin test        # Ejecuta las 51 pruebas unitarias con Vitest
pnpm --filter server-admin typecheck   # Verifica tipos con tsc --noEmit
pnpm --filter server-admin lint        # Ejecuta ESLint
pnpm --filter server-admin format      # Formatea con Prettier
```

---

## 7. Decisiones de Seguridad y Rendimiento

1. **Extraccion de JWT Multi-Canal (`TokenService`):**
   - Acepta el token desde el header `x-token`, `Authorization: Bearer <token>` o la cookie `httpOnly` `kinal_access` enviada por `client-admin` (`withCredentials: true`).
2. **Caché `Cache-Aside` e Invalidacion Automatica (`RedisCacheService`):**
   - `FieldService.list` y `FieldService.findById` sirven las canchas desde Redis (`kinal:fields:*`, TTL 120 s).
   - Al crear (`POST /fields`), actualizar (`PUT /fields/:id`) o activar/desactivar (`PUT /fields/:id/activate|deactivate`) una cancha, se invalidan automaticamente todas las llaves `kinal:fields:*` en Redis para que tanto el dashboard como la app movil vean los cambios al instante.
3. **Subida Segura a Cloudinary:**
   - Los Guards y el interceptor `ValidateRequest` se ejecutan **antes** de subir la imagen a Cloudinary; si el guardado en MongoDB falla, la imagen recien subida se elimina automaticamente.

---

## 8. Referencia de Endpoints

**URL Base:** `http://localhost:3009/kinalSportsAdmin/v1`

### Canchas (`/fields`)

| Metodo  | Ruta                     | Descripcion                                                      | Autenticacion            |
| :------ | :----------------------- | :--------------------------------------------------------------- | :----------------------- |
| `GET`   | `/fields`                | Listar canchas con paginacion (`?page=1&limit=10&isActive=true`) | JWT o `x-internal-token` |
| `QUERY` | `/fields`                | Consulta filtrada de canchas enviando criterios en el body JSON  | JWT o `x-internal-token` |
| `GET`   | `/fields/:id`            | Obtener cancha por ID                                            | JWT o `x-internal-token` |
| `POST`  | `/fields`                | Crear cancha (`multipart/form-data`, campo `image`)              | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id`            | Actualizar cancha (`multipart/form-data`, campo `image`)         | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id/activate`   | Activar cancha                                                   | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id/deactivate` | Desactivar cancha                                                | JWT (`ADMIN_ROLE`)       |

### Reservaciones (`/reservations`)

| Metodo | Ruta                        | Descripcion                                                  | Autenticacion |
| :----- | :-------------------------- | :----------------------------------------------------------- | :------------ |
| `GET`  | `/reservations`             | Listar reservaciones (enriquecidas con cancha y usuario)     | JWT           |
| `GET`  | `/reservations/:id`         | Obtener reservacion por ID                                   | JWT           |
| `PUT`  | `/reservations/:id/confirm` | Confirmar reservacion pendiente (antes de su hora de inicio) | JWT           |
| `PUT`  | `/reservations/:id/cancel`  | Cancelar reservacion                                         | JWT           |

### Equipos (`/teams`)

| Metodo   | Ruta                                 | Descripcion                                        | Autenticacion                |
| :------- | :----------------------------------- | :------------------------------------------------- | :--------------------------- |
| `GET`    | `/teams`                             | Listar equipos                                     | JWT o `x-internal-token`     |
| `GET`    | `/teams/:id`                         | Obtener equipo por ID                              | JWT o `x-internal-token`     |
| `POST`   | `/teams`                             | Crear equipo (`multipart/form-data`, campo `logo`) | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id`                         | Actualizar equipo                                  | JWT (`ADMIN_ROLE` o capitan) |
| `PUT`    | `/teams/:id/activate`                | Activar equipo                                     | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id/deactivate`              | Desactivar equipo                                  | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id/manager`                 | Cambiar capitan/manager del equipo                 | JWT (`ADMIN_ROLE`)           |
| `POST`   | `/teams/:id/named-members`           | Agregar miembro nombrado                           | JWT (`ADMIN_ROLE`)           |
| `DELETE` | `/teams/:id/named-members/:memberId` | Eliminar miembro nombrado                          | JWT (`ADMIN_ROLE`)           |

### Torneos (`/tournaments`) y Salud (`/health`)

| Metodo   | Ruta                          | Descripcion                                       | Autenticacion            |
| :------- | :---------------------------- | :------------------------------------------------ | :----------------------- |
| `GET`    | `/tournaments`                | Listar torneos                                    | JWT o `x-internal-token` |
| `GET`    | `/tournaments/:id`            | Obtener torneo por ID                             | JWT o `x-internal-token` |
| `POST`   | `/tournaments`                | Crear torneo                                      | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id`            | Actualizar torneo                                 | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id/activate`   | Activar torneo                                    | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id/deactivate` | Desactivar torneo                                 | JWT (`ADMIN_ROLE`)       |
| `DELETE` | `/tournaments/:id`            | Eliminar torneo                                   | JWT (`ADMIN_ROLE`)       |
| `GET`    | `/health`                     | Estado de salud del servicio y conexion a MongoDB | Publico                  |

### Ejemplo con `curl` (Metodo HTTP `QUERY`)

```bash
curl -X QUERY http://localhost:3009/kinalSportsAdmin/v1/fields \
  -H "x-internal-token: KinalSportsInternalSecretToken2026!" \
  -H "Content-Type: application/json" \
  -d '{"fieldType":"SINTETICA","capacity":"FUTBOL_7","maxPricePerHour":250,"search":"Cancha"}'
```

---

## 9. Integracion con Otros Servicios

| Servicio                             | Relacion                                                                        |
| :----------------------------------- | :------------------------------------------------------------------------------ |
| `auth-service` / `auth-node`         | Emision de JWT y consulta interna de perfiles (`QUERY /auth/profile/by-id`).    |
| `server-user`                        | Comparte MongoDB y la caché `kinal:fields:*` y `kinal:user:profile:*` en Redis. |
| `client-admin` / `client-admin-next` | Consumidores principales del panel administrativo.                              |
