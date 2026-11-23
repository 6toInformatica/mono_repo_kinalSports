# Server User — API Publica de Usuarios (Express 5)

Microservicio de negocio para los usuarios finales de KinalSports construido con **Express 5**, **Node.js (ESM)**, **MongoDB 7 (Mongoose 9)** y **Redis 7** en arquitectura por capas (`controller` → `service` → `repository`).

---

## 1. Rol en la Arquitectura

- Atiende todas las operaciones de usuario de la aplicacion movil (`client-user`): exploracion de canchas, reservaciones, creacion y gestion de equipos, inscripcion en torneos y edicion de perfil.
- Comparte la base de datos MongoDB 7 y el espacio de caché en Redis (`kinal:fields:*` y `kinal:user:profile:*`) con `server-admin`.
- Se comunica internamente con `auth-node` (perfiles y foto de perfil) y `server-admin` (lecturas internas) usando `x-internal-token`.

---

## 2. Stack Tecnologico

- **Runtime y Framework:** Node.js 22.13+ (Node 26 en Docker, ESM), Express 5.x
- **Base de Datos y Caché:** MongoDB 7, Mongoose 9, Redis 7 (`redis.cache.js` con fallback en memoria)
- **Seguridad y Validacion:** JWT (`HS256`), Helmet 8, CORS, `express-rate-limit`, `express-validator`
- **Archivos y Clientes HTTP:** Multer + Cloudinary, Axios (con timeouts configurados), `fetch` nativo
- **Pruebas:** Vitest 5

---

## 3. Estructura del Proyecto

```
server-user/
├── index.js                        # Punto de entrada del servidor
├── configs/
│   ├── app.js                      # Validacion de env al arranque, middlewares, rutas y apagado ordenado
│   ├── db.js                       # Conexion a MongoDB e inspeccion de estado (isDatabaseConnected)
│   ├── cors-configuration.js       # CORS con soporte para credenciales y metodo HTTP QUERY
│   └── helmet-configuration.js     # Cabeceras HTTP de seguridad
├── middlewares/
│   ├── auth.middleware.js          # Validacion JWT (Authorization: Bearer o cookie httpOnly kinal_access)
│   ├── file-uploader.js            # Recepcion en memoria de logos y fotos de perfil
│   ├── handle-errors.js            # Manejador global de errores de Express
│   ├── rate-limit-user.js          # Rate limiting especifico por ruta
│   └── request-limit.js            # Rate limiting general por IP
├── src/
│   ├── infrastructure/
│   │   ├── admin.client.js         # Cliente HTTP interno hacia server-admin
│   │   ├── auth.client.js          # Cliente HTTP interno hacia auth-node (QUERY profile/by-* + Redis)
│   │   ├── cloudinary.storage.js   # Subida de logos de equipos a Cloudinary
│   │   └── redis.cache.js          # Cliente Redis Cache-Aside (RESP2) con fallback en memoria
│   ├── shared/
│   │   ├── errors.js               # Errores tipados (AppError) y conversion de CastError a 400 INVALID_ID
│   │   └── user-format.js          # Normalizacion de datos publicos de usuario
│   ├── fields/                     # Exploracion y busqueda filtrada (GET y QUERY /fields)
│   ├── reservations/               # Disponibilidad, creacion, cancelacion e historial de reservas
│   ├── teams/                      # Creacion, union, salida y administracion de miembros de equipos
│   ├── tournaments/                # Listado, detalle e inscripcion de equipos en torneos
│   └── users/                      # Consulta de perfil y actualizacion de avatar
├── .env.example
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp server-user/.env.example server-user/.env
pnpm --filter server-user dev
```

### Opcion B: Como microservicio independiente (aislado)

```bash
cd server-user
pnpm install
cp .env.example .env
pnpm dev
```

---

## 5. Variables de Entorno (`.env`)

Copia `.env.example` a `.env`:

```env
NODE_ENV=development
PORT=3008

# MongoDB (compartida con server-admin)
URI_MONGODB=mongodb://localhost:27020/kinalSports

# JWT (debe coincidir con auth-node y auth-service)
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# Servicios internos y Caché Redis
ADMIN_SERVICE_URL=http://localhost:3009/kinalSportsAdmin/v1
AUTH_NODE_URL=http://localhost:3007/api/v1
INTERNAL_SERVICE_TOKEN=KinalSportsInternalSecretToken2026!
REDIS_URL=redis://localhost:6379

# Reglas de horario y CORS
BUSINESS_TIMEZONE=America/Guatemala
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

# Cloudinary (logos de equipos)
CLOUDINARY_CLOUD_NAME=b3xvlule
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_TEAMS_FOLDER=kinal_sports/teams
```

> Al iniciar, `validateEnv()` en `configs/app.js` verifica que `URI_MONGODB` y `JWT_SECRET` (minimo 32 caracteres) esten presentes.

---

## 6. Scripts Disponibles

```bash
pnpm --filter server-user dev        # Servidor de desarrollo con nodemon (puerto 3008)
pnpm --filter server-user start      # Ejecucion de produccion (node index.js)
pnpm --filter server-user test       # Ejecuta las 53 pruebas unitarias con Vitest
pnpm --filter server-user lint       # Ejecuta ESLint
pnpm --filter server-user lint:fix   # Corrige automaticamente problemas de ESLint
pnpm --filter server-user format     # Formatea el codigo con Prettier
```

---

## 7. Decisiones de Seguridad y Rendimiento

1. **Autenticacion Dual (`middlewares/auth.middleware.js`):**
   - Acepta el JWT tanto desde el header `Authorization: Bearer <token>` (usado por `client-user` movil) como desde la cookie `httpOnly` `kinal_access` (para clientes web).
2. **Caché `Cache-Aside` Compartida en Redis (`src/infrastructure/redis.cache.js`):**
   - `listFields` y `getField` leen/escriben `kinal:fields:*` (TTL 120 s), que `server-admin` invalida automaticamente cuando un administrador modifica una cancha.
   - `getUsersByIds` cachea perfiles en `kinal:user:profile:<userId>` (TTL 60 s) e invalida la llave al actualizar la foto de perfil.
3. **Metodo HTTP `QUERY`:**
   - Expone `QUERY /kinalSportsUser/v1/fields` para filtrar canchas por superficie, capacidad, precio maximo y nombre en el body JSON, y consume `QUERY /api/v1/auth/profile/by-id` y `/by-username` hacia `auth-node`.

---

## 8. Referencia de Endpoints

**URL Base:** `http://localhost:3008/kinalSportsUser/v1`

### Canchas (`/fields` — Publico)

| Metodo  | Endpoint      | Descripcion                                                 | Autenticacion |
| :------ | :------------ | :---------------------------------------------------------- | :------------ |
| `GET`   | `/fields`     | Listar canchas disponibles con paginacion                   | Publico       |
| `QUERY` | `/fields`     | Consultar canchas con filtros estructurados en el body JSON | Publico       |
| `GET`   | `/fields/:id` | Obtener detalle de una cancha por ID                        | Publico       |

### Perfil de Usuario (`/users` — JWT)

| Metodo | Endpoint                        | Descripcion                                            | Autenticacion |
| :----- | :------------------------------ | :----------------------------------------------------- | :------------ |
| `GET`  | `/users/profile`                | Obtener perfil del usuario autenticado                 | JWT           |
| `PUT`  | `/users/profile/picture`        | Actualizar foto de perfil (`profilePicture` multipart) | JWT           |
| `POST` | `/users/profile/picture/avatar` | Alias para actualizar foto (`avatar` multipart)        | JWT           |

### Reservaciones (`/reservations` — JWT)

| Metodo | Endpoint                        | Descripcion                                            | Autenticacion |
| :----- | :------------------------------ | :----------------------------------------------------- | :------------ |
| `GET`  | `/reservations/availability`    | Consultar horarios ocupados de una cancha en una fecha | JWT           |
| `GET`  | `/reservations/my-reservations` | Listar reservaciones del usuario autenticado           | JWT           |
| `GET`  | `/reservations/me/history`      | Historial paginado de reservaciones del usuario        | JWT           |
| `GET`  | `/reservations/:id`             | Detalle de una reservacion propia                      | JWT           |
| `POST` | `/reservations`                 | Crear una nueva reservacion (1 a 3 h, 06:00-22:00)     | JWT           |
| `PUT`  | `/reservations/:id/cancel`      | Cancelar una reservacion propia antes de su inicio     | JWT           |

### Equipos (`/teams` — JWT)

| Metodo   | Endpoint                             | Descripcion                                              | Autenticacion |
| :------- | :----------------------------------- | :------------------------------------------------------- | :------------ |
| `GET`    | `/teams`                             | Listar equipos activos                                   | JWT           |
| `GET`    | `/teams/me/mis-equipos`              | Listar equipos donde participa el usuario                | JWT           |
| `GET`    | `/teams/:id`                         | Obtener detalle del equipo con perfiles enriquecidos     | JWT           |
| `POST`   | `/teams`                             | Crear equipo (`multipart/form-data`, campo `logo`)       | JWT           |
| `PUT`    | `/teams/:id`                         | Actualizar equipo (solo capitan)                         | JWT           |
| `POST`   | `/teams/:id/join`                    | Unirse a un equipo activo con cupo disponible            | JWT           |
| `POST`   | `/teams/:id/leave`                   | Abandonar un equipo                                      | JWT           |
| `POST`   | `/teams/:id/members`                 | Agregar miembro registrado por `username` (solo capitan) | JWT           |
| `DELETE` | `/teams/:id/members/:userId`         | Eliminar miembro registrado (solo capitan)               | JWT           |
| `POST`   | `/teams/:id/named-members`           | Agregar miembro invitado por nombre (solo capitan)       | JWT           |
| `DELETE` | `/teams/:id/named-members/:memberId` | Eliminar miembro invitado (solo capitan)                 | JWT           |

### Torneos (`/tournaments` — JWT) y Salud (`/health`)

| Metodo | Endpoint                      | Descripcion                                                | Autenticacion |
| :----- | :---------------------------- | :--------------------------------------------------------- | :------------ |
| `GET`  | `/tournaments`                | Listar torneos                                             | JWT           |
| `GET`  | `/tournaments/me/mis-torneos` | Listar torneos donde participan equipos del usuario        | JWT           |
| `GET`  | `/tournaments/:id`            | Obtener detalle de un torneo                               | JWT           |
| `POST` | `/tournaments/:id/register`   | Inscribir equipo en torneo (solo capitan, misma categoria) | JWT           |
| `GET`  | `/health`                     | Estado del servicio y verificacion de conexion a MongoDB   | Publico       |

### Ejemplos con `curl`

```bash
# Consulta filtrada de canchas con el metodo HTTP QUERY
curl -X QUERY http://localhost:3008/kinalSportsUser/v1/fields \
  -H "Content-Type: application/json" \
  -d '{"fieldType":"SINTETICA","capacity":"FUTBOL_7","maxPricePerHour":250}'

# Crear una reservacion
curl -X POST http://localhost:3008/kinalSportsUser/v1/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fieldId":"60d0fe4f5311236168a109ca","startTime":"2026-06-16T16:00:00.000Z","endTime":"2026-06-16T18:00:00.000Z"}'
```

---

## 9. Integracion con Otros Servicios

| Servicio                     | Relacion                                                                                     |
| :--------------------------- | :------------------------------------------------------------------------------------------- |
| `auth-node` / `auth-service` | Validacion JWT y enriquecimiento de perfiles (`QUERY /auth/profile/by-id` y `/by-username`). |
| `server-admin`               | Comparte MongoDB y la caché `kinal:fields:*` y `kinal:user:profile:*` en Redis.              |
| `client-user`                | Aplicacion movil consumidora principal.                                                      |
