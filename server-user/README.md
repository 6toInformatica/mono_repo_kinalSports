# Server User - API Publica de Usuarios

API RESTful para usuarios finales de la plataforma KinalSports. Consumida por **client-user** (app movil Expo).

## Descripcion

Permite a usuarios autenticados explorar campos, crear y gestionar reservas, administrar equipos, inscribirse en torneos y editar su perfil. Comparte la base de datos MongoDB con `server-admin`.

## Tech Stack

- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express 5.x
- **Base de Datos**: MongoDB (compartida con server-admin)
- **ODM**: Mongoose 8.x
- **Autenticacion**: JWT (emitido por auth-node)
- **Seguridad**: Helmet, CORS, Rate Limiting

## Instalacion

```bash
# Desde la raiz del monorepo
pnpm install

# O este servicio
pnpm --filter server-user install
cp server-user/.env.example server-user/.env
```

## Variables de Entorno

```env
PORT=3008
URI_MONGODB=mongodb://localhost:27017/kinalSports
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService
AUTH_NODE_URL=http://localhost:3007/api/v1
ADMIN_SERVICE_URL=http://localhost:3009/kinalSportsAdmin/v1
INTERNAL_SERVICE_TOKEN=your-internal-token
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Estructura

```
server-user/
├── configs/
├── helpers/
│   ├── profile-enrichment.js
│   ├── team-enrichment.js
│   └── team-helpers.js
├── middlewares/
├── src/
│   ├── auth/
│   ├── fields/
│   ├── reservations/
│   ├── teams/           # Implementado
│   ├── tournaments/     # Implementado
│   └── users/
├── utils/
│   └── authClient.js    # Cliente hacia auth-node
└── index.js
```

## Scripts

```bash
pnpm --filter server-user dev
pnpm --filter server-user start
pnpm --filter server-user lint
pnpm --filter server-user lint:fix
```

## Endpoints

**Base path:** `/kinalSportsUser/v1`  
**Puerto por defecto:** `3008`

Las rutas de negocio (excepto fields GET y health) requieren `Authorization: Bearer <token>`.

### Campos (publico)

| Metodo | Endpoint      | Descripcion               |
| ------ | ------------- | ------------------------- |
| GET    | `/fields`     | Listar campos disponibles |
| GET    | `/fields/:id` | Detalle de un campo       |

### Perfil de usuario (JWT)

| Metodo | Endpoint                | Descripcion                            |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/users/profile`        | Obtener perfil del usuario autenticado |
| PUT    | `/users/profile`        | Actualizar perfil                      |
| POST   | `/users/profile/avatar` | Subir avatar (multipart)               |

### Reservas (JWT)

| Metodo | Endpoint                        | Descripcion              |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/reservations/availability`    | Consultar disponibilidad |
| GET    | `/reservations/my-reservations` | Mis reservas             |
| GET    | `/reservations/me/history`      | Historial de reservas    |
| POST   | `/reservations`                 | Crear reserva            |
| PUT    | `/reservations/:id/cancel`      | Cancelar reserva         |

### Equipos (JWT)

| Metodo | Endpoint                             | Descripcion                         |
| ------ | ------------------------------------ | ----------------------------------- |
| GET    | `/teams`                             | Listar equipos                      |
| GET    | `/teams/me/mis-equipos`              | Mis equipos                         |
| POST   | `/teams`                             | Crear equipo (con logo)             |
| GET    | `/teams/:id`                         | Detalle de equipo                   |
| POST   | `/teams/:id/join`                    | Unirse a equipo                     |
| POST   | `/teams/:id/leave`                   | Abandonar equipo                    |
| POST   | `/teams/:id/members`                 | Agregar miembro (capitan)           |
| DELETE | `/teams/:id/members/:userId`         | Eliminar miembro (capitan)          |
| POST   | `/teams/:id/named-members`           | Agregar miembro nombrado (capitan)  |
| DELETE | `/teams/:id/named-members/:memberId` | Eliminar miembro nombrado (capitan) |

### Torneos (JWT)

| Metodo | Endpoint                      | Descripcion                |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/tournaments`                | Listar torneos             |
| GET    | `/tournaments/me/mis-torneos` | Mis torneos                |
| GET    | `/tournaments/:id`            | Detalle de torneo          |
| POST   | `/tournaments/:id/register`   | Inscribir equipo en torneo |

### Health Check

| Metodo | Endpoint  | Descripcion         |
| ------ | --------- | ------------------- |
| GET    | `/health` | Estado del servicio |

## Ejemplos

**Listar campos:**

```bash
curl http://localhost:3008/kinalSportsUser/v1/fields
```

**Crear reserva:**

```bash
curl -X POST http://localhost:3008/kinalSportsUser/v1/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fieldId":"...","startTime":"2026-06-16T10:00:00.000Z","endTime":"2026-06-16T12:00:00.000Z"}'
```

**Cancelar reserva:**

```bash
curl -X PUT http://localhost:3008/kinalSportsUser/v1/reservations/<id>/cancel \
  -H "Authorization: Bearer <token>"
```

## Autenticacion

1. El usuario obtiene JWT desde **auth-node** (via client-user)
2. Middleware `validate-JWT.js` verifica token, issuer y audience
3. Perfil enriquecido consultando auth-node via `authClient.js`

Rutas publicas: `GET /fields`, `GET /fields/:id`, `GET /health`

## Dependencias con Otros Servicios

| Servicio     | Rol                                                               |
| ------------ | ----------------------------------------------------------------- |
| auth-node    | Emision y validacion de JWT; datos de perfil                      |
| server-admin | Fuente de datos compartida en MongoDB; lecturas via token interno |
| client-user  | Frontend movil principal                                          |

## Validaciones y Seguridad

- Conflictos de reservas (horarios superpuestos)
- Validacion de ownership al cancelar
- Rate limiting y CORS configurados
- Comunicacion interna con server-admin via `INTERNAL_SERVICE_TOKEN`

## Proximas Funcionalidades

- [ ] Sistema de notificaciones push
- [ ] Ratings y reviews de campos
- [ ] Paginacion avanzada en historial

## Autor

**Braulio Echeverria**

## Licencia

MIT
