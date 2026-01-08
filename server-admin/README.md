# Server Admin - API de Gestión Administrativa

API RESTful para gestión administrativa de campos deportivos, reservas y torneos en la plataforma KinalSports.

## 📋 Descripción

Servicio backend que proporciona endpoints para que administradores gestionen campos deportivos, confirmen/rechacen reservas, administren torneos y equipos. Consume el servicio de autenticación para validar permisos de administrador.

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express 5.x
- **Base de Datos**: MongoDB 6.0+
- **ODM**: Mongoose 8.x
- **Autenticación**: JWT (validación contra auth-service)
- **Validación**: express-validator
- **Storage**: Cloudinary (imágenes de campos)
- **Documentación**: Swagger (swagger-ui-express)
- **Seguridad**: Helmet, CORS, Rate Limiting

## 🚀 Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# O específicamente este servicio
pnpm --filter server-admin install
```

## ⚙️ Variables de Entorno

Crear archivo `.env` en `server-admin/`:

```env
# Server
NODE_ENV=development
PORT=3002

# MongoDB
URI_MONGODB=mongodb://localhost:27017/kinalsports

# JWT Configuration
JWT_SECRET=tu-secret-key-aqui
JWT_ISSUER=KinalSportsAuth
JWT_AUDIENCE=KinalSportsAPI

# Cloudinary (upload de imágenes de campos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=kinalSports/fields
CLOUDINARY_TEAMS_FOLDER=kinalSports/teams
```

## 📂 Estructura

```
server-admin/
├── configs/
│   ├── app.js                    # Configuración principal del servidor
│   ├── db.js                     # Conexión MongoDB
│   ├── cors-configuration.js     # Configuración CORS
│   └── helmet-configuration.js   # Headers de seguridad
├── middlewares/
│   ├── validate-JWT.js           # Verificación de tokens
│   ├── validate-role.js          # Verificación de roles (ADMIN)
│   ├── field-validators.js       # Validadores de campos deportivos
│   ├── reservation-validators.js # Validadores de reservas
│   ├── reservation-conflict.js   # Validación de conflictos
│   ├── file-uploader.js          # Multer + Cloudinary
│   └── handle-errors.js          # Manejo centralizado de errores
├── src/
│   ├── fields/
│   │   ├── field.controller.js       # Controladores de campos
│   │   ├── field.model.js            # Modelo de campo deportivo
│   │   └── field.routes.js           # Rutas de campos
│   ├── reservations/
│   │   ├── reservation.controller.js # Controladores de reservas
│   │   ├── reservation.model.js      # Modelo de reserva
│   │   └── reservation.routes.js     # Rutas de reservas
│   ├── teams/
│   │   ├── team.controller.js        # Controladores de equipo
│   │   ├── team.model.js             # Modelo de equipos deportivo
│   │   └── team.routes.js            # Rutas de equipos
│   └── tournaments/
│       ├── tournament.controller.js  # Controladores de torneos
│       ├── tournament.model.js       # Modelo de torneo
│       └── tournament.routes.js      # Rutas de torneos
└── index.js                          # Punto de entrada
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo con auto-reload
pnpm --filter server-admin dev

# Producción
pnpm --filter server-admin start

# Lint
pnpm --filter server-admin lint
pnpm --filter server-admin lint:fix

# Format
pnpm --filter server-admin format
pnpm --filter server-admin format:check
```

## 🔌 Endpoints Principales

### Campos Deportivos

| Método | Endpoint                                     | Descripción             | Auth  |
| ------ | -------------------------------------------- | ----------------------- | ----- |
| GET    | `/kinalSportsAdmin/v1/fields`                | Listar todos los campos | Admin |
| GET    | `/kinalSportsAdmin/v1/fields/:id`            | Obtener campo por ID    | Admin |
| POST   | `/kinalSportsAdmin/v1/fields`                | Crear nuevo campo       | Admin |
| PUT    | `/kinalSportsAdmin/v1/fields/:id`            | Actualizar campo        | Admin |
| PUT    | `/kinalSportsAdmin/v1/fields/:id/activate`   | Activar campo           | Admin |
| PUT    | `/kinalSportsAdmin/v1/fields/:id/deactivate` | Desactivar campo        | Admin |

### Reservas

| Método | Endpoint                                        | Descripción               | Auth  |
| ------ | ----------------------------------------------- | ------------------------- | ----- |
| GET    | `/kinalSportsAdmin/v1/reservations`             | Listar todas las reservas | Admin |
| GET    | `/kinalSportsAdmin/v1/reservations/:id`         | Obtener reserva por ID    | Admin |
| PUT    | `/kinalSportsAdmin/v1/reservations/:id/confirm` | Confirmar reserva         | Admin |

### Equipos deportivos

| Método | Endpoint                                    | Descripción                 | Auth  |
| ------ | ------------------------------------------- | --------------------------- | ----- |
| GET    | `/kinalSportsAdmin/v1/teams`                | Listar todos los equipos    | Admin |
| GET    | `/kinalSportsAdmin/v1/teams/:id`            | Obtener un equipo por ID    | Admin |
| POST   | `/kinalSportsAdmin/v1/teams`                | Crear un nuevo equipo       | Admin |
| PUT    | `/kinalSportsAdmin/v1/teams/:id`            | Actualizar datos del equipo | Admin |
| PUT    | `/kinalSportsAdmin/v1/teams/:id/activate`   | Activar equipo              | Admin |
| PUT    | `/kinalSportsAdmin/v1/teams/:id/deactivate` | Desactivar equipo           | Admin |
| DELETE | `/kinalSportsAdmin/v1/teams/:id`            | Eliminar equipo             | Admin |

### Torneos

| Método | Endpoint                                          | Descripción                 | Auth  |
| ------ | ------------------------------------------------- | --------------------------- | ----- |
| GET    | `/kinalSportsAdmin/v1/tournaments`                | Listar todos los torneos    | Admin |
| GET    | `/kinalSportsAdmin/v1/tournaments/:id`            | Obtener un torneo por ID    | Admin |
| POST   | `/kinalSportsAdmin/v1/tournaments`                | Crear un nuevo torneo       | Admin |
| PUT    | `/kinalSportsAdmin/v1/tournaments/:id`            | Actualizar datos del torneo | Admin |
| PUT    | `/kinalSportsAdmin/v1/tournaments/:id/activate`   | Activar torneo              | Admin |
| PUT    | `/kinalSportsAdmin/v1/tournaments/:id/deactivate` | Desactivar torneo           | Admin |
| DELETE | `/kinalSportsAdmin/v1/tournaments/:id`            | Eliminar torneo             | Admin |

### Ejemplo de Requests Campo

**Crear Campo:**

```bash
POST http://localhost:3002/kinalSportsAdmin/v1/fields
Content-Type: multipart/form-data

{
  "fieldName": "Cancha Futbol 11",
  "description": "Cancha de futbol tamaño reglamentario",
  "fieldType": "NATURAL",
  "capacity": "FUTBOL_11",
  "pricePerHour": 150.00,
  "image": <file>
}
```

**Listar Reservas:**

```bash
GET http://localhost:3002/kinalSportsAdmin/v1/reservations?status=PENDING
```

**Confirmar Reserva:**

```bash
PUT http://localhost:3002/kinalSportsAdmin/v1/reservations/507f1f77bcf86cd799439011/confirm
Content-Type: application/json

{
  "confirmedBy": "admin-user-id"
}
```

## 🗄️ Modelos de Base de Datos

### Field (Campo Deportivo)

```javascript
{
  _id: ObjectId,
  fieldName: String (required, max 100),
  description: String (max 500),
  fieldType: String (enum: 'NATURAL', 'SINTETICA', 'CONCRETO'),
  capacity: String (enum: 'FUTBOL_5', 'FUTBOL_7', 'FUTBOL_11'),
  pricePerHour: Number (required, min 0),
  photo: String (Cloudinary URL),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Reservation (Reserva)

```javascript
{
  _id: ObjectId,
  userId: String (UUID del auth-service),
  fieldId: ObjectId (ref: Field),
  startTime: Date (required),
  endTime: Date (required),
  status: String (enum: 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'),
  confirmation: {
    confirmedAt: Date,
    confirmedBy: String
  },
  lastModifiedBy: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Team (Equipo Deportivo)

**Listar todo:**

```javascript
GET http://localhost:3002/kinalSportsAdmin/v1/teams
```

**Listar todo:**

```javascript
GET http://localhost:3002/kinalSportsAdmin/v1/teams/67af2c9082b48b2be88bb72d
```

**Crear un quipo:**

```javascript
POST http://localhost:3002/kinalSportsAdmin/v1/teams

{
  "teamName": "Los Halcones",
  "managerName": "Carlos López",
  "category": "FUTBOL_11",
  "uniformColor": "Azul",
  "logo": <file>    # OPCIONAL
}
```

**Actualizar equipo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/teams/67af2c9082b48b2be88bb72d

{
  "teamName": "Los Halcones FC",
  "managerName": "Eduardo Pérez",
  "category": "FUTBOL_11",
  "uniformColor": "Negro",
  "logo": <file>    # OPCIONAL (reemplaza el anterior)
}
```

**Activar equipo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/teams/67af2c9082b48b2be88bb72d/activate
```

**Desactivar equipo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/teams/67af2c9082b48b2be88bb72d/deactivate
```

**Eliminar equipo:**

```javascript
DELETE http://localhost:3002/kinalSportsAdmin/v1/teams/67af2c9082b48b2be88bb72d
```

### Tournament (Torneo)

**Listar todo:**

```javascript
GET http://localhost:3002/kinalSportsAdmin/v1/tournaments
```

**Listar todo:**

```javascript
GET http://localhost:3002/kinalSportsAdmin/v1/tournaments/67af2c9082b48b2be88bb72d
```

**Crear un torneo:**

```javascript
POST http://localhost:3002/kinalSportsAdmin/v1/tournaments

{
  "tournamentName": "Copa de Campeones",
  "category": "FUTBOL_11",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "location": "Ciudad de Guatemala",
  "description": "Torneo de fútbol de la ciudad de Guatemala",
  "logo": <file>    # OPCIONAL
}
```

**Actualizar torneo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/tournaments/67af2c9082b48b2be88bb72d

{
  "tournamentName": "Copa de Campeones",
  "category": "FUTBOL_11",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "location": "Ciudad de Guatemala",
  "description": "Torneo de fútbol de la ciudad de Guatemala",
  "logo": <file>    # OPCIONAL (reemplaza el anterior)
}
```

**Activar torneo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/tournaments/67af2c9082b48b2be88bb72d/activate
```

**Desactivar torneo:**

```javascript
PUT http://localhost:3002/kinalSportsAdmin/v1/tournaments/67af2c9082b48b2be88bb72d/deactivate
```

**Eliminar torneo:**

```javascript
DELETE http://localhost:3002/kinalSportsAdmin/v1/tournaments/67af2c9082b48b2be88bb72d
```

## 🔐 Autenticación y Autorización

Este servicio **NO maneja autenticación directamente**. Consume el `auth-service` mediante:

1. **Middleware `validate-JWT.js`**: Verifica token JWT en header `Authorization: Bearer <token>`
2. **Middleware `validate-role.js`**: Valida que el usuario tenga rol `ADMIN`

**Flujo de autenticación:**

```
Cliente → [JWT Token] → server-admin → validate-JWT → decodifica token →
verifica rol ADMIN → permite acceso
```

## 🔗 Dependencias con Otros Servicios

- **auth-node / auth-service**: Valida tokens JWT y obtiene información de usuario
- **server-user**: Puede compartir modelos de Reservation (usuarios crean, admins confirman)
- **client-admin**: Frontend que consume todos estos endpoints

## 🛡️ Validaciones y Seguridad

- **Validación de conflictos**: No permite reservas superpuestas en el mismo campo
- **Validación de horarios**: Valida que startTime < endTime y duración mínima
- **Rate limiting**: 100 requests por 15 minutos
- **Sanitización**: express-validator sanitiza todos los inputs
- **CORS**: Solo orígenes permitidos en `.env`

## 📊 Swagger / API Documentation

**Nota**: Swagger aún no está configurado en este servicio.

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
pnpm --filter server-admin test
```

## 📝 Notas de Desarrollo

- El servidor escucha en el puerto definido en `.env` (default: 3002)
- Las rutas están prefijadas con `/api`
- Todas las rutas requieren autenticación JWT con rol ADMIN
- Las imágenes de campos se suben automáticamente a Cloudinary
- MongoDB se conecta automáticamente al iniciar el servidor
- Los errores se manejan centralizadamente y devuelven JSON estructurado

## 🚀 Próximas Funcionalidades

- [ ] CRUD completo de torneos
- [ ] Gestión de equipos
- [ ] Reportes y estadísticas
- [ ] Notificaciones push/email al confirmar reservas
- [ ] Dashboard de métricas (reservas por mes, ingresos, etc.)

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
