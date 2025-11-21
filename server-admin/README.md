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
MONGODB_URI=mongodb://localhost:27017/kinalsports_admin
MONGODB_URI_PROD=mongodb+srv://user:password@cluster.mongodb.net/kinalsports_admin

# Auth Service
AUTH_SERVICE_URL=http://localhost:3001
JWT_SECRET=debe-coincidir-con-auth-service

# Cloudinary (upload de imágenes de campos)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=kinalSports/fields

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
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
│   │   ├── field.controller.js   # Controladores de campos
│   │   ├── field.model.js        # Modelo de campo deportivo
│   │   └── field.routes.js       # Rutas de campos
│   ├── reservations/
│   │   ├── reservation.controller.js # Controladores de reservas
│   │   ├── reservation.model.js      # Modelo de reserva
│   │   └── reservation.routes.js     # Rutas de reservas
│   └── tournaments/
│       ├── tournament.controller.js  # Controladores de torneos
│       ├── tournament.model.js       # Modelo de torneo
│       └── tournament.routes.js      # Rutas de torneos
└── index.js                      # Punto de entrada
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

| Método | Endpoint                     | Descripción             | Auth  |
| ------ | ---------------------------- | ----------------------- | ----- |
| GET    | `/api/fields`                | Listar todos los campos | Admin |
| GET    | `/api/fields/:id`            | Obtener campo por ID    | Admin |
| POST   | `/api/fields`                | Crear nuevo campo       | Admin |
| PUT    | `/api/fields/:id`            | Actualizar campo        | Admin |
| PUT    | `/api/fields/:id/activate`   | Activar campo           | Admin |
| PUT    | `/api/fields/:id/deactivate` | Desactivar campo        | Admin |

### Reservas

| Método | Endpoint                        | Descripción               | Auth  |
| ------ | ------------------------------- | ------------------------- | ----- |
| GET    | `/api/reservations`             | Listar todas las reservas | Admin |
| GET    | `/api/reservations/:id`         | Obtener reserva por ID    | Admin |
| PUT    | `/api/reservations/:id/confirm` | Confirmar reserva         | Admin |

### Torneos (Pendiente)

| Método | Endpoint               | Descripción       | Auth  |
| ------ | ---------------------- | ----------------- | ----- |
| GET    | `/api/tournaments`     | Listar torneos    | Admin |
| POST   | `/api/tournaments`     | Crear torneo      | Admin |
| PUT    | `/api/tournaments/:id` | Actualizar torneo | Admin |

### Ejemplo de Requests

**Crear Campo:**

```bash
POST http://localhost:3002/api/fields
Authorization: Bearer <admin-jwt-token>
Content-Type: multipart/form-data

{
  "name": "Cancha Futbol 11",
  "description": "Cancha de futbol tamaño reglamentario",
  "type": "FUTBOL",
  "capacity": 22,
  "pricePerHour": 150.00,
  "location": "Zona 10, Guatemala",
  "amenities": ["Iluminación", "Vestidores", "Estacionamiento"],
  "image": <file>
}
```

**Listar Reservas:**

```bash
GET http://localhost:3002/api/reservations?status=PENDING&startDate=2025-11-20
Authorization: Bearer <admin-jwt-token>
```

**Confirmar Reserva:**

```bash
PUT http://localhost:3002/api/reservations/507f1f77bcf86cd799439011/confirm
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "notes": "Reserva confirmada. Pago recibido."
}
```

## 🗄️ Modelos de Base de Datos

### Field (Campo Deportivo)

```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  type: String (FUTBOL, BASKETBALL, VOLLEYBALL, etc.),
  capacity: Number,
  pricePerHour: Number (required),
  location: String,
  amenities: [String],
  imageUrl: String (Cloudinary),
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
  date: Date (required),
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  duration: Number (horas),
  totalPrice: Number,
  status: String (PENDING, CONFIRMED, CANCELLED),
  paymentStatus: String (PENDING, PAID, REFUNDED),
  notes: String,
  adminNotes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Tournament (Torneo) - Pendiente

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  fieldIds: [ObjectId],
  teams: [ObjectId],
  status: String (SCHEDULED, IN_PROGRESS, COMPLETED),
  createdAt: Date,
  updatedAt: Date
}
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

Acceder a la documentación interactiva en:

```
http://localhost:3002/api-docs
```

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
