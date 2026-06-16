# Kinal Sports - Administration Server

Microservicio de administracion para la plataforma Kinal Sports. Gestiona campos deportivos, reservas, equipos y torneos. Proporciona una API RESTful para el panel admin (`client-admin`).

Implementa arquitectura modular con Express.js y MongoDB.

## Descripcion

Este servicio es consumido por **client-admin** y tambien expone lecturas a **server-user** mediante JWT o token interno (`x-internal-token`).

## Funcionalidades Principales

### Gestion de Campos Deportivos

- Creacion y actualizacion de campos con imagenes (Cloudinary)
- Consulta de campos (JWT o token interno)
- Activacion/desactivacion de campos
- Validacion de datos

### Gestion de Reservas

- Consulta de reservas con filtros
- Confirmacion y cancelacion de reservas
- Validacion de conflictos de horarios

### Gestion de Equipos

- Registro y actualizacion de equipos con logo
- Gestion de managers y miembros nombrados
- Activacion/desactivacion de equipos

### Gestion de Torneos

- Creacion y actualizacion de torneos
- Activacion/desactivacion de torneos
- Eliminacion de torneos

### Seguridad

- Validacion JWT en rutas protegidas
- Token interno para comunicacion entre microservicios
- Rate limiting, Helmet, CORS
- Validacion con express-validator

## Tecnologias

- **Express.js** 5.x, **Node.js**, **Mongoose** 9.x, **MongoDB**
- **Cloudinary** + Multer para imagenes
- **JWT** (tokens emitidos por auth-service)

## Endpoints API

**Base URL:** `http://localhost:{PORT}/kinalSportsAdmin/v1`

Puerto por defecto: `3002` (local segun `.env.example`), `3009` (Docker Compose).

### Campos (`/fields`)

| Metodo | Ruta                     | Descripcion              | Auth                     |
| ------ | ------------------------ | ------------------------ | ------------------------ |
| GET    | `/fields`                | Listar campos            | JWT o `x-internal-token` |
| GET    | `/fields/:id`            | Obtener campo por ID     | JWT o `x-internal-token` |
| POST   | `/fields`                | Crear campo (con imagen) | JWT (ADMIN)              |
| PUT    | `/fields/:id`            | Actualizar campo         | JWT (ADMIN)              |
| PUT    | `/fields/:id/activate`   | Activar campo            | JWT (ADMIN)              |
| PUT    | `/fields/:id/deactivate` | Desactivar campo         | JWT (ADMIN)              |

### Reservas (`/reservations`)

| Metodo | Ruta                        | Descripcion                 | Auth |
| ------ | --------------------------- | --------------------------- | ---- |
| GET    | `/reservations`             | Listar reservas con filtros | JWT  |
| GET    | `/reservations/:id`         | Obtener reserva por ID      | JWT  |
| PUT    | `/reservations/:id/confirm` | Confirmar reserva           | JWT  |
| PUT    | `/reservations/:id/cancel`  | Cancelar reserva            | JWT  |

### Equipos (`/teams`)

| Metodo | Ruta                                 | Descripcion               | Auth                     |
| ------ | ------------------------------------ | ------------------------- | ------------------------ |
| GET    | `/teams`                             | Listar equipos            | JWT o `x-internal-token` |
| GET    | `/teams/:id`                         | Obtener equipo por ID     | JWT o `x-internal-token` |
| POST   | `/teams`                             | Crear equipo (con logo)   | JWT (ADMIN)              |
| PUT    | `/teams/:id`                         | Actualizar equipo         | JWT (ADMIN o capitan)    |
| PUT    | `/teams/:id/activate`                | Activar equipo            | JWT (ADMIN)              |
| PUT    | `/teams/:id/deactivate`              | Desactivar equipo         | JWT (ADMIN)              |
| PUT    | `/teams/:id/manager`                 | Cambiar manager           | JWT (ADMIN)              |
| POST   | `/teams/:id/named-members`           | Agregar miembro nombrado  | JWT (ADMIN)              |
| DELETE | `/teams/:id/named-members/:memberId` | Eliminar miembro nombrado | JWT (ADMIN)              |

### Torneos (`/tournaments`)

| Metodo | Ruta                          | Descripcion           | Auth                     |
| ------ | ----------------------------- | --------------------- | ------------------------ |
| GET    | `/tournaments`                | Listar torneos        | JWT o `x-internal-token` |
| GET    | `/tournaments/:id`            | Obtener torneo por ID | JWT o `x-internal-token` |
| POST   | `/tournaments`                | Crear torneo          | JWT (ADMIN)              |
| PUT    | `/tournaments/:id`            | Actualizar torneo     | JWT (ADMIN)              |
| PUT    | `/tournaments/:id/activate`   | Activar torneo        | JWT (ADMIN)              |
| PUT    | `/tournaments/:id/deactivate` | Desactivar torneo     | JWT (ADMIN)              |
| DELETE | `/tournaments/:id`            | Eliminar torneo       | JWT (ADMIN)              |

### Salud

| Metodo | Ruta      | Descripcion         | Auth |
| ------ | --------- | ------------------- | ---- |
| GET    | `/health` | Estado del servicio | No   |

Respuesta esperada:

```json
{
  "status": "Healthy",
  "timestamp": "2026-06-16T12:00:00.000Z",
  "service": "KinalSports Admin Server"
}
```

## Estructura del Proyecto

```
server-admin/
├── configs/
│   ├── app.js
│   ├── cors.configuration.js
│   ├── db.js
│   ├── helmet.configuration.js
│   └── rateLimit.configuration.js
├── middlewares/
├── src/
│   ├── fields/
│   ├── reservations/
│   ├── teams/
│   └── tournaments/
├── helpers/
├── utils/
│   └── authClient.js         # Cliente hacia auth-service
├── index.js
└── package.json
```

## Configuracion

### Requisitos

- Node.js 18+
- pnpm 10+
- MongoDB 6+ (Docker usa mongo:7)
- Cuenta Cloudinary

### Variables de Entorno

Copia `.env.example` a `.env`:

```env
PORT=3002
URI_MONGODB=mongodb://localhost:27017/kinal-sports-admin
ADMIN_ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=your-jwt-secret-key-here
JWT_ISSUER=auth-service
JWT_AUDIENCE=admin-service
AUTH_SERVICE_URL=http://localhost:5156/api/v1
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Instalacion

```bash
cd server-admin
pnpm install
cp .env.example .env
pnpm run dev
```

### Scripts

```bash
pnpm run dev      # Desarrollo con nodemon
node index.js     # Produccion
```

## Integracion con Microservicios

| Servicio     | Integracion                                                      |
| ------------ | ---------------------------------------------------------------- |
| auth-service | Validacion JWT y consulta de perfiles (`AUTH_SERVICE_URL`)       |
| server-user  | Comparte MongoDB; server-user consume lecturas via token interno |
| client-admin | Frontend principal                                               |

## Health Check

```bash
curl http://localhost:3009/kinalSportsAdmin/v1/health
```

## Autor

**Braulio Echeverria** — IN6AV - Kinal Guatemala 2026

## Licencia

MIT — ver [LICENSE](LICENSE)
