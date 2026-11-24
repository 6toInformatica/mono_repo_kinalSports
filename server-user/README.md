# Server User — API de Operaciones de Usuario (Express 5)

## 1. Propósito del Componente

`server-user` es el microservicio de negocio orientado a los jugadores y capitanes de equipo de **KinalSports**, construido con **Node.js (ESM)**, **Express 5**, **MongoDB 7 (Mongoose 9)** y **Redis 7** siguiendo una **Arquitectura por Capas**.

Su objetivo es exponer los flujos operativos del deportista (exploración y filtrado de canchas, consulta de disponibilidad horaria, creación y cancelación de reservaciones propias, creación y administración de equipos, inscripción en torneos y gestión del perfil) aplicando todas las reglas de negocio del complejo deportivo.

---

## 2. Responsabilidad dentro de KinalSports

- Es el backend de negocio consumido por la aplicación móvil `client-user` (React Native + Expo).
- Comparte la base de datos documental `kinalSports` en **MongoDB 7** y el espacio de claves de caché en **Redis 7** (`kinal:fields:*` y `kinal:user:profile:*`) con `server-admin`.
- Consulta y actualiza información de identidad en `auth-node` (`AUTH_NODE_URL`, puerto `3007`) utilizando llamadas internas autenticadas con `x-internal-token` (`QUERY /api/v1/auth/profile/by-id` y `QUERY /api/v1/auth/profile/by-username`) y reenviando la subida de avatares del usuario.

---

## 3. Stack Tecnológico Verificado

| Categoría                    | Paquete / Versión (`package.json`)                                                                                       | Uso en el Servicio                                                                                             |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Runtime y Módulos**        | Node.js `>= 22.13.0` (`node:26-slim` en Docker), ECMAScript Modules (`"type": "module"`)                                 | Ejecución nativa en JavaScript moderno sin paso de transpilación.                                              |
| **Framework HTTP**           | `express` `^5.3.0`                                                                                                       | Enrutamiento modular, soporte nativo de promesas en middlewares y método `router.query`.                       |
| **Base de Datos y Caché**    | `mongoose` `^9.12.1`, `src/infrastructure/redis.cache.js`                                                                | Modelos sobre MongoDB 7 y caché `Cache-Aside` sobre Redis 7 con fallback en memoria.                           |
| **Seguridad y Validación**   | `jsonwebtoken` `^9.0.3`, `helmet` `^8.3.0`, `cors` `^2.8.6`, `express-rate-limit` `^8.7.4`, `express-validator` `^7.3.2` | Validación de JWT (Bearer o cookie `httpOnly`), cabeceras HTTP, control de tasa y validación de entradas.      |
| **Archivos y Clientes HTTP** | `multer` `^2.5.0`, `cloudinary` `^2.11.0`, `axios` `^1.21.1`, `uuid` `^13.0.2`                                           | Subida de logos de equipos a Cloudinary y cliente HTTP hacia `auth-node` / `server-admin` con timeouts de 8 s. |
| **Pruebas Unitarias**        | `vitest` `^5.1.0`                                                                                                        | Pruebas unitarias de servicios de dominio, middlewares y caché Redis.                                          |

---

## 4. Arquitectura Interna (Arquitectura por Capas)

Cada dominio funcional dentro de `src/` (`fields`, `reservations`, `teams`, `tournaments`, `users`) se estructura en cuatro capas con responsabilidades bien delimitadas:

1. **Rutas (`*.routes.js`):** Declaran los endpoints Express, aplican los middlewares de autenticación (`validateJWT`), límite de tasa y carga de archivos, y delegan en el controlador.
2. **Controladores (`*.controller.js`):** Extraen parámetros de `req.params`, `req.query`, `req.body` y `req.user`, invocan al servicio de aplicación y devuelven la respuesta HTTP (`res.status(...).json(...)`).
3. **Servicios (`*.service.js`):** Contienen todas las reglas de negocio (validación de horarios, traslape de reservas, límites de integrantes por categoría de fútbol, permisos de capitán e interacción con la caché Redis y clientes internos).
4. **Repositorios y Modelos (`*.repository.js` y `*.model.js`):** Encapsulan las consultas de Mongoose hacia las colecciones `fields`, `reservations`, `teams` y `tournaments` de MongoDB.

> **Nota sobre la comunicación con `server-admin`:** Aunque existe el adaptador `src/infrastructure/admin.client.js` (`ADMIN_SERVICE_URL`), las operaciones de lectura de canchas en `src/fields/field.service.js` y la validación de canchas activas al reservar en `src/reservations/reservation.service.js` se realizan directamente sobre la colección `fields` de la base **MongoDB compartida** y las claves `kinal:fields:*` de **Redis**, evitando saltos HTTP innecesarios en cada consulta.

---

## 5. Estructura Principal del Directorio

```text
server-user/
├── index.js                            # Punto de entrada del servidor
├── configs/
│   ├── app.js                          # Validación de entorno (validateEnv), middlewares, montaje de rutas y apagado ordenado
│   ├── db.js                           # Conexión a MongoDB e inspección de estado (isDatabaseConnected)
│   ├── cors-configuration.js           # Configuración de CORS (incluye método QUERY y credentials: true)
│   └── helmet-configuration.js         # Configuración de cabeceras de seguridad Helmet
├── middlewares/
│   ├── auth.middleware.js              # Validación de JWT (Authorization: Bearer o cookie kinal_access)
│   ├── file-uploader.js                # Recepción en memoria (Multer) para logos e imágenes de perfil
│   ├── handle-errors.js                # Manejador centralizado de errores (AppError y CastError -> 400 INVALID_ID)
│   ├── rate-limit-user.js              # Limitador de tasa específico por operación
│   └── request-limit.js                # Limitador de tasa general por IP
├── src/
│   ├── infrastructure/
│   │   ├── admin.client.js             # Cliente HTTP interno hacia server-admin (timeout 8000 ms)
│   │   ├── auth.client.js              # Cliente HTTP interno hacia auth-node (QUERY profile/by-* + Redis)
│   │   ├── cloudinary.storage.js       # Subida de logos de equipos a Cloudinary
│   │   └── redis.cache.js              # Cliente Redis Cache-Aside (RESP2) con fallback en memoria
│   ├── shared/
│   │   ├── errors.js                   # Clase AppError y utilidades de validación de ObjectId
│   │   └── user-format.js              # Normalización de perfiles públicos de usuario
│   ├── fields/                         # Exploración y búsqueda filtrada de canchas (GET y QUERY /fields)
│   ├── reservations/                   # Disponibilidad, creación, cancelación e historial de reservas
│   ├── teams/                          # Creación, unión, abandono y gestión de miembros de equipos
│   ├── tournaments/                    # Consulta e inscripción de equipos en torneos
│   └── users/                          # Consulta de perfil propio y cambio de fotografía/avatar
├── .env.example
├── eslint.config.js
└── package.json
```

---

## 6. Requisitos

- **Node.js:** `>= 22.13.0`
- **pnpm:** `>= 10`
- **MongoDB:** `7+`
- **Servicio `auth-node` activo (`:3007`):** Requerido para consultar perfiles de integrantes y actualizar fotografías de perfil.
- **Redis:** `7+` (opcional en desarrollo local gracias al fallback en memoria).

---

## 7. Configuración de Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp server-user/.env.example server-user/.env
```

Al arrancar, `validateEnv()` en `configs/app.js` verifica obligatoriamente que `URI_MONGODB` esté definida y que `JWT_SECRET` tenga al menos 32 caracteres:

| Variable                                                                 | Requerida | Valor de Referencia (Local)                                         | Descripción                                                                     |
| :----------------------------------------------------------------------- | :-------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------ |
| `NODE_ENV`                                                               | No        | `development`                                                       | Entorno de ejecución (`development`, `test`, `production`).                     |
| `PORT`                                                                   | No        | `3008`                                                              | Puerto HTTP del servicio.                                                       |
| `URI_MONGODB`                                                            | Sí        | `mongodb://localhost:27020/kinalSports`                             | Cadena de conexión a MongoDB 7 (compartida con `server-admin`).                 |
| `JWT_SECRET`                                                             | Sí        | _(mínimo 32 caracteres)_                                            | Clave simétrica `HS256` compartida con `auth-node` y `auth-service`.            |
| `JWT_ISSUER` / `JWT_AUDIENCE`                                            | No        | `AuthService` / `AuthService`                                       | Emisor y audiencia validados en el token JWT.                                   |
| `AUTH_NODE_URL`                                                          | Sí        | `http://localhost:3007/api/v1`                                      | URL base de `auth-node` para consultas internas y subida de avatar.             |
| `ADMIN_SERVICE_URL`                                                      | No        | `http://localhost:3009/kinalSportsAdmin/v1`                         | URL base de `server-admin`.                                                     |
| `INTERNAL_SERVICE_TOKEN`                                                 | Sí        | _(secreto compartido)_                                              | Token enviado en la cabecera `x-internal-token`.                                |
| `REDIS_URL`                                                              | No        | `redis://localhost:6379`                                            | URL de conexión a Redis 7.                                                      |
| `BUSINESS_TIMEZONE`                                                      | No        | `America/Guatemala`                                                 | Zona horaria utilizada para validar el horario de atención (`06:00` a `22:00`). |
| `ALLOWED_ORIGINS`                                                        | No        | `http://localhost:3000,http://localhost:3001,http://localhost:5173` | Orígenes habilitados en CORS.                                                   |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Sí        | _(credenciales Cloudinary)_                                         | Configuración para subir logotipos de equipos.                                  |
| `CLOUDINARY_TEAMS_FOLDER`                                                | No        | `kinal_sports/teams`                                                | Carpeta de Cloudinary para logotipos de equipos.                                |

---

## 8. Ejecución Local

### Desde la raíz del monorepo

```bash
pnpm --filter server-user dev
```

### Desde el directorio del servicio

```bash
cd server-user
pnpm install
pnpm dev
```

### Scripts disponibles en `package.json`

- `pnpm dev`: Ejecuta `nodemon index.js` con recarga automática en el puerto `3008`.
- `pnpm start`: Ejecuta `node index.js` para entornos de producción.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Ejecuta las pruebas unitarias con Vitest.
- `pnpm lint` / `pnpm lint:fix`: Analiza el código con ESLint 9.
- `pnpm format`: Formatea el código con Prettier.

---

## 9. Integraciones, Reglas de Negocio y Referencia de Endpoints

**Prefijo base:** `/kinalSportsUser/v1` | **Puerto:** `3008`

### 9.1 Reglas de Negocio Verificadas en los Servicios

- **Reservaciones (`src/reservations/reservation.service.js`):**
  - La fecha de inicio debe ser futura, en horas exactas, con una duración de **1 a 3 horas** dentro del horario de atención (`06:00` a `22:00` en `BUSINESS_TIMEZONE`).
  - La cancha debe existir, estar activa (`isActive: true`) y no tener otra reservación `PENDING` o `CONFIRMED` traslapada en ese rango horario.
  - Un usuario solo puede cancelar sus propias reservaciones en estado `PENDING` o `CONFIRMED` cuya hora de inicio aún no haya transcurrido.
- **Equipos (`src/teams/team.service.js`):**
  - Solo se permite unirse o agregar integrantes a equipos activos (`isActive: true`).
  - Límite de integrantes (miembros registrados + miembros nombrados): **12 jugadores** para `FUTBOL_7` y **18 jugadores** para `FUTBOL_11`.
  - Solo el capitán (`managerId`) puede editar el equipo, agregar/eliminar miembros por `username` o gestionar miembros nombrados.
- **Torneos (`src/tournaments/tournament.service.js`):**
  - Solo el capitán de un equipo activo puede inscribirlo en un torneo activo cuyo estado sea `PENDIENTE`, cuya fecha de inicio sea futura, que tenga cupo disponible (`teams.length < maxTeams`) y cuya categoría coincida con la del equipo.

### 9.2 Tabla de Endpoints

| Módulo       | Método                     | Ruta                            | Descripción                                                                                                        | Autenticación |
| :----------- | :------------------------- | :------------------------------ | :----------------------------------------------------------------------------------------------------------------- | :------------ |
| **Canchas**  | `GET`                      | `/fields`                       | Lista canchas disponibles con paginación y filtros por query string (caché Redis `kinal:fields:*`).                | Público       |
| **Canchas**  | `QUERY`                    | `/fields`                       | Filtra canchas enviando `{ page, limit, isActive, fieldType, capacity, maxPricePerHour, search }` en el body JSON. | Público       |
| **Canchas**  | `GET`                      | `/fields/:id`                   | Obtiene el detalle de una cancha por su ID.                                                                        | Público       |
| **Usuarios** | `GET`                      | `/users/profile`                | Obtiene el perfil del usuario autenticado desde `auth-node` / Redis.                                               | JWT           |
| **Usuarios** | `PUT`                      | `/users/profile/picture`        | Actualiza la foto de perfil (`profilePicture` multipart) e invalida caché en Redis.                                | JWT           |
| **Usuarios** | `POST`                     | `/users/profile/picture/avatar` | Alias para actualizar la foto de perfil (`avatar` multipart).                                                      | JWT           |
| **Reservas** | `GET`                      | `/reservations/availability`    | Devuelve los bloques horarios ocupados de una cancha en una fecha (`?fieldId=...&date=YYYY-MM-DD`).                | JWT           |
| **Reservas** | `GET`                      | `/reservations/my-reservations` | Lista las reservaciones del usuario autenticado.                                                                   | JWT           |
| **Reservas** | `GET`                      | `/reservations/me/history`      | Historial paginado de reservaciones del usuario.                                                                   | JWT           |
| **Reservas** | `GET`                      | `/reservations/:id`             | Obtiene el detalle de una reservación propia.                                                                      | JWT           |
| **Reservas** | `POST`                     | `/reservations`                 | Crea una nueva reservación.                                                                                        | JWT           |
| **Reservas** | `PUT`                      | `/reservations/:id/cancel`      | Cancela una reservación propia antes de su inicio.                                                                 | JWT           |
| **Equipos**  | `GET`                      | `/teams`                        | Lista equipos activos.                                                                                             | JWT           |
| **Equipos**  | `GET`                      | `/teams/me/mis-equipos`         | Lista los equipos donde el usuario es capitán o miembro.                                                           | JWT           |
| **Equipos**  | `GET`                      | `/teams/:id`                    | Detalle del equipo con perfiles de miembros enriquecidos vía Redis / `auth-node`.                                  | JWT           |
| **Equipos**  | `POST`                     | `/teams`                        | Crea un equipo (`multipart/form-data`, campo opcional `logo`).                                                     | JWT           |
| **Equipos**  | `PUT`                      | `/teams/:id`                    | Actualiza nombre, categoría o logo del equipo (solo capitán).                                                      | JWT           |
| **Equipos**  | `POST`                     | `/teams/:id/join`               | Permite al usuario autenticado unirse a un equipo activo con cupo.                                                 | JWT           |
| **Equipos**  | `POST`                     | `/teams/:id/leave`              | Permite a un miembro abandonar un equipo (el capitán no puede abandonar su propio equipo).                         | JWT           |
| **Equipos**  | `/teams/:id/members`       | `POST` / `DELETE /:userId`      | Agrega miembro por `{ username }` o elimina miembro registrado (solo capitán).                                     | JWT           |
| **Equipos**  | `/teams/:id/named-members` | `POST` / `DELETE /:memberId`    | Agrega o elimina un integrante invitado por nombre (solo capitán).                                                 | JWT           |
| **Torneos**  | `GET`                      | `/tournaments`                  | Lista torneos disponibles.                                                                                         | JWT           |
| **Torneos**  | `GET`                      | `/tournaments/me/mis-torneos`   | Lista los torneos en los que participan equipos del usuario.                                                       | JWT           |
| **Torneos**  | `GET`                      | `/tournaments/:id`              | Obtiene el detalle de un torneo.                                                                                   | JWT           |
| **Torneos**  | `POST`                     | `/tournaments/:id/register`     | Inscribe un equipo (`{ teamId }`) en el torneo (solo capitán).                                                     | JWT           |
| **Salud**    | `GET`                      | `/health`                       | Estado del servicio y verificación de conexión a MongoDB (`503` si está desconectado).                             | Público       |

---

## 10. Pruebas

Las pruebas unitarias (`src/**/*.test.js`) se ejecutan con **Vitest**:

```bash
pnpm --filter server-user test
```

Verifican las reglas de negocio de `fields` (incluyendo consultas `QUERY` y caché), `reservations` (horarios, traslapes y cancelaciones), `teams` (cupos por categoría y permisos de capitán), `tournaments` (validaciones de inscripción), `users`, `auth.middleware` (extracción de JWT por header o cookie `httpOnly`) y `redis.cache`.

---

## 11. Build, Despliegue en Docker y Limitaciones Relevantes

### 11.1 Construcción Multi-Etapa en Docker

Al estar escrito directamente en JavaScript ESM, `server-user` no requiere etapa de transpilación. El archivo `dockerfiles/Dockerfile.server-user` define dos etapas sobre `node:26-slim`:

- **Etapa `dev`:** Instala todas las dependencias y ejecuta `nodemon --legacy-watch index.js` en el puerto `3008`.
- **Etapa `runtime`:** Instala exclusivamente las dependencias de producción (`pnpm install --frozen-lockfile --prod`) y ejecuta `node index.js` bajo el usuario sin privilegios `node`.

### 11.2 Limitaciones y Consideraciones Operativas

- **Acceso compartido a MongoDB y Redis:** Las operaciones de canchas (`src/fields/field.service.js` y `src/reservations/reservation.service.js`) consultan directamente la colección `fields` de MongoDB y las claves `kinal:fields:*` de Redis compartidas con `server-admin`, por lo que ambos servicios deben apuntar a la misma instancia de MongoDB y Redis para reflejar cambios e invalidaciones de caché inmediatamente.
- **Dependencia de `auth-node`:** El módulo `/users/profile` y la resolución de integrantes por `username` dependen de que `auth-node` (`AUTH_NODE_URL`) esté disponible y comparta el mismo `INTERNAL_SERVICE_TOKEN`.

---

## 12. Documentación Relacionada

- [README Principal del Monorepo](../README.md)
- [Arquitectura Detallada del Sistema](../docs/ARCHITECTURE.md)
- [Client User — Aplicación móvil consumidora](../client-user/README.md)
- [Auth Node — Servicio de autenticación consumido](../authentication-service/auth-node/README.md)
- [Server Admin — Servicio administrativo con MongoDB y Redis compartidos](../server-admin/README.md)
