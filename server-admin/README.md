# Server Admin — API de Administración (NestJS)

## 1. Propósito del Componente

`server-admin` es el microservicio administrativo de **KinalSports**, desarrollado con **NestJS 12**, **TypeScript**, **MongoDB 7 (Mongoose 9)** y **Redis 7**.

Su propósito es centralizar las operaciones de gestión del complejo deportivo (administración del catálogo de canchas, confirmación y cancelación de reservaciones, administración de equipos y control de torneos) bajo una **Arquitectura Modular** con validación declarativa, guardias de autorización por rol y sincronización de caché distribuida con la API de usuarios.

---

## 2. Responsabilidad dentro de KinalSports

- Es la fuente de escritura administrativa sobre la base de datos documental `kinalSports` en **MongoDB 7** (`fields`, `reservations`, `teams`, `tournaments`), la cual comparte con `server-user`.
- Atiende las peticiones de los dos paneles web administrativos: `client-admin` (React + Vite) y `client-admin-next` (Next.js BFF).
- Expone endpoints de lectura compatibles con autenticación interna (`x-internal-token`) a través de `AuthOrInternalGuard`.
- Mantiene la coherencia de la caché en **Redis 7**: cada vez que un administrador crea, actualiza, activa o desactiva una cancha, `server-admin` invalida el prefijo `kinal:fields:` para que tanto el panel administrativo como la aplicación móvil (`server-user`) consulten datos actualizados.
- Enriquece la información de reservaciones y equipos consultando los perfiles de usuario en el servicio de autenticación (`QUERY /api/v1/auth/profile/by-id`) respaldados bajo la clave `kinal:user:profile:<userId>`.

---

## 3. Stack Tecnológico Verificado

| Categoría                 | Paquete / Versión (`package.json`)                                                                 | Uso en el Servicio                                                                                                     |
| :------------------------ | :------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Runtime y Lenguaje**    | Node.js `>= 22.13.0` (`node:26-slim` en Docker), TypeScript `~6.0.3`                               | Ejecución sobre módulos ES y tipado estático con decoradores de NestJS.                                                |
| **Framework Backend**     | `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` `^12.4.2`, `@nestjs/config` `^12.1.1` | Inyección de dependencias, módulos de dominio, controladores, _guards_, _pipes_, _interceptors_ y _exception filters_. |
| **Persistencia y Caché**  | `@nestjs/mongoose` `^12.0.1`, `mongoose` `^9.12.1`, `RedisCacheService` (`src/common/cache/`)      | Esquemas y modelos de MongoDB 7 y caché `Cache-Aside` sobre Redis 7 con fallback a memoria.                            |
| **Seguridad HTTP**        | `jsonwebtoken` `^9.0.3`, `helmet` `^8.3.0`, `express-rate-limit` `^8.7.3`                          | Verificación de JWT (`HS256`), cabeceras HTTP de seguridad y límite de tasa de peticiones.                             |
| **Validación y Archivos** | `zod` `^4.6.7`, `validator` `^13.15.35`, `multer` `^2.5.0`, `cloudinary` `^2.11.0`                 | Validación de variables de entorno al arranque, recepción de archivos en memoria y subida a Cloudinary.                |
| **Pruebas Unitarias**     | `vitest` `^5.1.0`, `@swc/core` `^1.16.22`, `unplugin-swc` `^2.0.0`                                 | Compilación rápida de decoradores TypeScript y ejecución de pruebas unitarias.                                         |

---

## 4. Arquitectura Interna (Modular en NestJS)

El servicio se organiza en módulos cohesivos registrados en `AppModule` (`src/app.module.ts`):

1. **Módulos transversales (`src/common/` y `src/config/`):**
   - `SecurityModule` (`src/common/security/`): Provee `TokenService`, `JwtAuthGuard`, `RolesGuard`, `InternalTokenGuard` y `AuthOrInternalGuard`.
   - `CacheModule` (`src/common/cache/`): Exporta globalmente `RedisCacheService` (`get`, `set`, `del`, `delByPrefix`).
   - `ObjectIdPipe` (`src/common/pipes/object-id.pipe.ts`): Valida que los parámetros `:id` sean `ObjectId` válidos de MongoDB antes de invocar al servicio, respondiendo `400 Bad Request` en caso contrario.
   - `ValidateRequestInterceptor` (`src/common/validation/`): Ejecuta las reglas de validación del cuerpo de la petición antes del controlador.
   - `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`): Estandariza todas las respuestas de error en un formato JSON consistente (`{ success: false, message, ... }`).
2. **Módulo de Integraciones (`src/integrations/`):**
   - `AuthClientService`: Consulta perfiles de usuario en `AUTH_SERVICE_URL` utilizando el método HTTP `QUERY` (`QUERY /auth/profile/by-id`) con cabecera `x-internal-token`, timeout de `5000 ms` y caché en Redis (`kinal:user:profile:<userId>`, TTL 60 s).
   - `CloudinaryService`: Administra la subida de imágenes de canchas, logos de equipos y banners de torneos, eliminando automáticamente el archivo en Cloudinary si la operación subsecuente en MongoDB falla.
3. **Módulos de Dominio (`src/fields/`, `src/reservations/`, `src/teams/`, `src/tournaments/`, `src/health/`):**
   - Cada módulo encapsula su controlador (`*.controller.ts`), su servicio de negocio (`*.service.ts`) y su esquema de Mongoose (`*.schema.ts`).

---

## 5. Estructura Principal del Directorio

```text
server-admin/
├── src/
│   ├── main.ts                         # Arranque de NestJS, CORS, Helmet, Rate Limit y prefijo /kinalSportsAdmin/v1
│   ├── app.module.ts                   # Módulo raíz de la aplicación
│   ├── config/
│   │   ├── env.validation.ts           # Validación de variables de entorno con Zod
│   │   └── http.config.ts              # Configuración de seguridad HTTP y manejador 404
│   ├── common/
│   │   ├── cache/                      # CacheModule, RedisCacheService y pruebas unitarias
│   │   ├── filters/                    # AllExceptionsFilter
│   │   ├── pipes/                      # ObjectIdPipe
│   │   ├── security/                   # TokenService, Guards de autenticación/roles y pruebas
│   │   ├── upload/                     # MemoryUploadInterceptor (Multer en memoria)
│   │   └── validation/                 # Reglas e interceptor de validación de payloads
│   ├── integrations/
│   │   ├── auth-client.service.ts      # Cliente HTTP interno hacia auth-service / auth-node (QUERY + Redis)
│   │   └── cloudinary.service.ts       # Adaptador de subida y limpieza en Cloudinary
│   ├── health/                         # HealthController (verifica readyState de MongoDB)
│   ├── fields/                         # Módulo de canchas deportivas (incluye soporte HTTP QUERY)
│   ├── reservations/                   # Módulo de gestión administrativa de reservaciones
│   ├── teams/                          # Módulo de equipos, capitanes y miembros nombrados
│   └── tournaments/                    # Módulo de torneos deportivos
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 6. Requisitos

- **Node.js:** `>= 22.13.0`
- **pnpm:** `>= 10`
- **MongoDB:** `7+`
- **Servicio de autenticación activo:** `auth-service` (`:5156`) o `auth-node` (`:3007`) para resolver perfiles de usuario.
- **Redis:** `7+` (opcional en desarrollo local gracias al fallback en memoria).

---

## 7. Configuración (`.env`)

Copia `.env.example` a `.env`:

```bash
cp server-admin/.env.example server-admin/.env
```

Variables verificadas en `src/config/env.validation.ts`:

| Variable                                                                          | Requerida | Valor de Referencia (Local)                           | Descripción                                                                                                   |
| :-------------------------------------------------------------------------------- | :-------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                                                                        | No        | `development`                                         | Entorno (`development`, `test`, `production`).                                                                |
| `PORT`                                                                            | No        | `3009`                                                | Puerto HTTP del servicio.                                                                                     |
| `URI_MONGODB`                                                                     | Sí        | `mongodb://localhost:27020/kinalSports`               | Cadena de conexión a MongoDB 7 (base compartida con `server-user`).                                           |
| `JWT_SECRET`                                                                      | Sí        | _(mínimo 32 caracteres)_                              | Clave simétrica `HS256` compartida con `auth-service` y `auth-node`.                                          |
| `JWT_ISSUER` / `JWT_AUDIENCE`                                                     | No        | `AuthService` / `AuthService`                         | Emisor y audiencia esperados en los tokens JWT.                                                               |
| `AUTH_SERVICE_URL`                                                                | Sí        | `http://localhost:5156/api/v1`                        | URL base del servicio de autenticación. En `docker-compose.prod.yml` apunta a `http://auth-node:3007/api/v1`. |
| `INTERNAL_SERVICE_TOKEN`                                                          | Sí        | _(secreto compartido)_                                | Token para autenticar peticiones internas (`x-internal-token`).                                               |
| `REDIS_URL`                                                                       | No        | `redis://localhost:6379`                              | URL de conexión a Redis 7.                                                                                    |
| `ADMIN_ALLOWED_ORIGINS`                                                           | No        | `http://localhost:5173`                               | Lista de orígenes web permitidos en CORS (separados por coma). Sin valor permite `3000`, `3001` y `5173`.     |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`          | Sí        | _(credenciales Cloudinary)_                           | Credenciales de Cloudinary.                                                                                   |
| `CLOUDINARY_FOLDER` / `CLOUDINARY_TEAMS_FOLDER` / `CLOUDINARY_TOURNAMENTS_FOLDER` | No        | `kinal_sports/fields`, `.../teams`, `.../tournaments` | Carpetas destino en Cloudinary por tipo de entidad.                                                           |

---

## 8. Ejecución Local

### Desde la raíz del monorepo

```bash
pnpm --filter server-admin dev
```

### Desde el directorio del servicio

```bash
cd server-admin
pnpm install
pnpm dev
```

### Scripts disponibles en `package.json`

- `pnpm dev`: Inicia en modo desarrollo con recarga automática (`nodemon`).
- `pnpm build`: Compila TypeScript mediante `tsc -p tsconfig.build.json` en `dist/`.
- `pnpm start`: Inicia la aplicación compilada (`node dist/main.js`).
- `pnpm typecheck`: Verifica tipos con `tsc --noEmit`.
- `pnpm lint` / `pnpm lint:fix`: Ejecuta ESLint.
- `pnpm format`: Formatea el código con Prettier.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Ejecuta las pruebas unitarias con Vitest.

---

## 9. Integraciones y Referencia de Endpoints

**Prefijo global:** `/kinalSportsAdmin/v1` | **Puerto:** `3009`

`TokenService` acepta el JWT del administrador desde cualquiera de estos tres canales: cabecera `x-token`, cabecera `Authorization: Bearer <token>` o cookie `httpOnly` `kinal_access`.

### 9.1 Canchas (`/fields`)

| Método  | Ruta                     | Descripción                                                                                                        | Autenticación            |
| :------ | :----------------------- | :----------------------------------------------------------------------------------------------------------------- | :----------------------- |
| `GET`   | `/fields`                | Lista canchas paginadas (`?page=1&limit=10&isActive=true&fieldType=...`). Usa caché Redis `kinal:fields:*`.        | JWT o `x-internal-token` |
| `QUERY` | `/fields`                | Filtra canchas enviando `{ page, limit, isActive, fieldType, capacity, maxPricePerHour, search }` en el body JSON. | JWT o `x-internal-token` |
| `GET`   | `/fields/:id`            | Obtiene el detalle de una cancha por su `ObjectId`.                                                                | JWT o `x-internal-token` |
| `POST`  | `/fields`                | Crea una nueva cancha (`multipart/form-data`, campo `image`) e invalida `kinal:fields:*` en Redis.                 | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id`            | Actualiza los datos o fotografía de una cancha e invalida `kinal:fields:*` en Redis.                               | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id/activate`   | Activa una cancha e invalida `kinal:fields:*` en Redis.                                                            | JWT (`ADMIN_ROLE`)       |
| `PUT`   | `/fields/:id/deactivate` | Desactiva una cancha e invalida `kinal:fields:*` en Redis.                                                         | JWT (`ADMIN_ROLE`)       |

### 9.2 Reservaciones (`/reservations`)

| Método | Ruta                        | Descripción                                                                                                                             | Autenticación |
| :----- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| `GET`  | `/reservations`             | Lista reservaciones filtrables (`status`, `fieldId`, `userId`, `startDate`, `endDate`) enriquecidas con datos del usuario desde `auth`. | JWT           |
| `GET`  | `/reservations/:id`         | Obtiene el detalle de una reservación enriquecida con perfil de usuario y cancha.                                                       | JWT           |
| `PUT`  | `/reservations/:id/confirm` | Confirma una reservación pendiente (verifica que la hora de inicio aún no haya pasado).                                                 | JWT           |
| `PUT`  | `/reservations/:id/cancel`  | Cancela una reservación registrando opcionalmente `cancellationReason`.                                                                 | JWT           |

### 9.3 Equipos (`/teams`)

| Método   | Ruta                                 | Descripción                                                          | Autenticación                |
| :------- | :----------------------------------- | :------------------------------------------------------------------- | :--------------------------- |
| `GET`    | `/teams`                             | Lista equipos paginados con filtro `isActive` y búsqueda por nombre. | JWT o `x-internal-token`     |
| `GET`    | `/teams/:id`                         | Obtiene el detalle de un equipo.                                     | JWT o `x-internal-token`     |
| `POST`   | `/teams`                             | Crea un equipo (`multipart/form-data`, campo `logo`).                | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id`                         | Actualiza datos o logo de un equipo.                                 | JWT (`ADMIN_ROLE` o capitán) |
| `PUT`    | `/teams/:id/activate`                | Activa un equipo.                                                    | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id/deactivate`              | Desactiva un equipo.                                                 | JWT (`ADMIN_ROLE`)           |
| `PUT`    | `/teams/:id/manager`                 | Reasigna el capitán (`managerId`) del equipo.                        | JWT (`ADMIN_ROLE`)           |
| `POST`   | `/teams/:id/named-members`           | Agrega un integrante nombrado al equipo.                             | JWT (`ADMIN_ROLE`)           |
| `DELETE` | `/teams/:id/named-members/:memberId` | Elimina un integrante nombrado del equipo.                           | JWT (`ADMIN_ROLE`)           |

### 9.4 Torneos (`/tournaments`) y Salud (`/health`)

| Método   | Ruta                          | Descripción                                                                          | Autenticación            |
| :------- | :---------------------------- | :----------------------------------------------------------------------------------- | :----------------------- |
| `GET`    | `/tournaments`                | Lista torneos con filtros por estado, categoría y búsqueda.                          | JWT o `x-internal-token` |
| `GET`    | `/tournaments/:id`            | Obtiene el detalle de un torneo con sus equipos inscritos.                           | JWT o `x-internal-token` |
| `POST`   | `/tournaments`                | Crea un torneo (`multipart/form-data`, campo opcional `image`).                      | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id`            | Actualiza datos, estado o imagen de un torneo.                                       | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id/activate`   | Activa un torneo.                                                                    | JWT (`ADMIN_ROLE`)       |
| `PUT`    | `/tournaments/:id/deactivate` | Desactiva un torneo.                                                                 | JWT (`ADMIN_ROLE`)       |
| `DELETE` | `/tournaments/:id`            | Elimina un torneo.                                                                   | JWT (`ADMIN_ROLE`)       |
| `GET`    | `/health`                     | Verifica el estado del servicio y la conexión activa a MongoDB (`readyState === 1`). | Público                  |

---

## 10. Pruebas

La suite de pruebas unitarias (`src/**/*.test.ts`) utiliza **Vitest** junto con `@swc/core`:

```bash
pnpm --filter server-admin test
```

Cubre:

- `TokenService` (extracción desde `x-token`, `Authorization: Bearer` y cookie `kinal_access`), `RolesGuard` y `AuthOrInternalGuard`.
- `RedisCacheService` (lectura, escritura con TTL, borrado por prefijo e invalidación).
- Servicios y controladores de `fields` (incluyendo filtros `QUERY` e invalidación de caché), `reservations`, `teams`, `tournaments` y `CloudinaryService`.

---

## 11. Build, Despliegue en Docker y Limitaciones Relevantes

### 11.1 Construcción Multi-Etapa (`dockerfiles/Dockerfile.server-admin`)

El archivo `dockerfiles/Dockerfile.server-admin` construye la imagen sobre `node:26-slim`:

- **Etapa `dev`:** Monta el código fuente y ejecuta `nodemon --legacy-watch` en el puerto `3009`.
- **Etapa `runtime`:** Compila el proyecto con `pnpm build`, instala únicamente dependencias de producción (`--prod`) y ejecuta `node dist/main.js` bajo el usuario sin privilegios `node`.

### 11.2 Limitaciones y Consideraciones Operativas

- **Dependencia de servicio de autenticación para enriquecer perfiles:** Al listar o consultar reservaciones, `server-admin` consulta `AUTH_SERVICE_URL` (`auth-service` en dev, `auth-node` en prod). Si el servicio de autenticación no responde antes del timeout (`5000 ms`) y el perfil no está en Redis, la reservación se entrega sin los datos extendidos del usuario para no bloquear la operación.
- **Base documental compartida:** Cualquier cambio en los esquemas de Mongoose (`fields`, `reservations`, `teams`, `tournaments`) debe mantenerse sincronizado con los modelos de `server-user`.

---

## 12. Documentación Relacionada

- [README Principal del Monorepo](../README.md)
- [Arquitectura Detallada del Sistema (`docs/ARCHITECTURE.md`)](../docs/ARCHITECTURE.md)
- [Server User — API de usuarios que comparte MongoDB y Redis](../server-user/README.md)
- [Client Admin (React + Vite)](../client-admin/README.md)
- [Client Admin Next (Next.js BFF)](../client-admin-next/README.md)
