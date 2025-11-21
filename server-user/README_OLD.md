# Server User - API Pública de Usuarios

API RESTful para que usuarios finales consulten campos disponibles y gestionen sus reservas en la plataforma KinalSports.

## 📋 Descripción

Servicio backend público que permite a usuarios autenticados explorar campos deportivos disponibles, crear reservas, consultar su historial y cancelar reservas. Este servicio complementa al `server-admin` proporcionando endpoints orientados al usuario final.

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express 5.x
- **Base de Datos**: MongoDB 6.0+
- **ODM**: Mongoose 8.x
- **Autenticación**: JWT (validación contra auth-service)
- **Validación**: express-validator
- **Documentación**: Swagger (swagger-ui-express)
- **Seguridad**: Helmet, CORS, Rate Limiting

## 🚀 Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# O específicamente este servicio
pnpm --filter server-user install
```

## ⚙️ Variables de Entorno

Crear archivo `.env` en `server-user/`:

```env
# Server
NODE_ENV=development
PORT=3003

# MongoDB (comparte base de datos con server-admin)
URI_MONGODB=mongodb://localhost:27017/kinalsports

# JWT Configuration
JWT_SECRET=tu-secret-key-aqui
JWT_ISSUER=KinalSportsAuth
JWT_AUDIENCE=KinalSportsAPI
```

## 📂 Estructura

```
server-user/
├── configs/
│   ├── app.js                    # Configuración principal del servidor
│   ├── db.js                     # Conexión MongoDB
│   ├── cors-configuration.js     # Configuración CORS
│   └── helmet-configuration.js   # Headers de seguridad
├── helpers/
│   └── validation-helpers.js     # Helpers de validación
├── middlewares/
│   ├── validate-JWT.js           # Verificación de tokens
│   ├── reservation-validators.js # Validadores de reservas
│   ├── reservation-conflict.js   # Validación de conflictos
│   └── handle-errors.js          # Manejo centralizado de errores
├── src/
│   ├── fields/
│   │   ├── field.controller.js   # Controladores de campos (solo lectura)
│   │   ├── field.model.js        # Modelo de campo deportivo
│   │   └── field.routes.js       # Rutas de campos
│   ├── reservations/
│   │   ├── reservation.controller.js # Controladores de reservas
│   │   ├── reservation.model.js      # Modelo de reserva
│   │   └── reservation.routes.js     # Rutas de reservas
│   └── tournaments/
│       ├── tournament.controller.js  # Controladores de torneos (solo lectura)
│       ├── tournament.model.js       # Modelo de torneo
│       └── tournament.routes.js      # Rutas de torneos
├── utils/
│   └── validation-utils.js       # Utilidades de validación
└── index.js                      # Punto de entrada
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo con auto-reload
pnpm --filter server-user dev

# Producción
pnpm --filter server-user start

# Lint
pnpm --filter server-user lint
pnpm --filter server-user lint:fix

# Format
pnpm --filter server-user format
pnpm --filter server-user format:check
```

## 🔌 Endpoints Principales

### Campos Deportivos (Solo Lectura)

| Método | Endpoint          | Descripción               | Auth |
| ------ | ----------------- | ------------------------- | ---- |
| GET    | `/api/fields`     | Listar campos activos     | No\* |
| GET    | `/api/fields/:id` | Obtener detalles de campo | No\* |

\*Puede requerir autenticación según configuración

### Reservas

| Método | Endpoint                            | Descripción         | Auth             |
| ------ | ----------------------------------- | ------------------- | ---------------- |
| POST   | `/api/reservations`                 | Crear nueva reserva | Sí (USER)        |
| GET    | `/api/reservations/my-reservations` | Mis reservas        | Sí (USER)        |
| GET    | `/api/reservations/:id`             | Detalles de reserva | Sí (USER, owner) |
| PUT    | `/api/reservations/:id/cancel`      | Cancelar reserva    | Sí (USER, owner) |

### Torneos (Solo Lectura)

| Método | Endpoint               | Descripción            | Auth |
| ------ | ---------------------- | ---------------------- | ---- |
| GET    | `/api/tournaments`     | Listar torneos activos | No   |
| GET    | `/api/tournaments/:id` | Detalles de torneo     | No   |

### Ejemplo de Requests

**Listar Campos Disponibles:**

```bash
GET http://localhost:3003/kinalSportsUser/v1/fields
```

**Crear Reserva:**

```bash
POST http://localhost:3003/api/reservations
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "fieldId": "507f1f77bcf86cd799439011",
  "date": "2025-11-25",
  "startTime": "14:00",
  "endTime": "16:00",
  "notes": "Partido amistoso"
}
```

**Mis Reservas:**

```bash
GET http://localhost:3003/kinalSportsUser/v1/reservations/my-reservations
Authorization: Bearer <user-jwt-token>
```

**Cancelar Reserva:**

```bash
PUT http://localhost:3003/api/reservations/507f1f77bcf86cd799439012/cancel
Authorization: Bearer <user-jwt-token>
Content-Type: application/json

{
  "reason": "Cambio de planes"
}
```

## 🗄️ Modelos de Base de Datos

### Field (Compartido con server-admin)

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: String (FUTBOL, BASKETBALL, VOLLEYBALL, etc.),
  capacity: Number,
  pricePerHour: Number,
  location: String,
  amenities: [String],
  imageUrl: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Reservation (Compartido con server-admin)

```javascript
{
  _id: ObjectId,
  userId: String (UUID del auth-service),
  fieldId: ObjectId (ref: Field),
  date: Date,
  startTime: String (HH:mm),
  endTime: String (HH:mm),
  duration: Number,
  totalPrice: Number,
  status: String (PENDING, CONFIRMED, CANCELLED),
  paymentStatus: String (PENDING, PAID, REFUNDED),
  notes: String (del usuario),
  adminNotes: String (solo visible para admin),
  cancellationReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Autenticación y Autorización

- **Middleware `validate-JWT.js`**: Verifica token JWT en rutas protegidas
- **Validación de ownership**: Los usuarios solo pueden ver/modificar sus propias reservas
- **Permisos**:
  - `USER`: Puede crear y cancelar sus propias reservas
  - Solo el owner de una reserva puede cancelarla

**Flujo de autenticación:**

```
Cliente → [JWT Token] → server-user → validate-JWT → decodifica userId →
verifica ownership → permite acceso
```

## 🔗 Dependencias con Otros Servicios

- **auth-node / auth-service**: Valida tokens JWT y obtiene userId
- **server-admin**: Comparte base de datos MongoDB (mismas colecciones Fields y Reservations)
- **client-user (Mobile App)**: Frontend móvil que consume estos endpoints

## 🛡️ Validaciones y Seguridad

### Validación de Reservas

- **Disponibilidad**: Verifica que el campo esté activo
- **Conflictos**: No permite reservas superpuestas
- **Horarios válidos**: Valida formato HH:mm y coherencia startTime < endTime
- **Duración mínima**: Mínimo 1 hora de reserva
- **Fecha futura**: No permite reservas en el pasado

### Validación de Cancelación

- **Ownership**: Solo el creador puede cancelar su reserva
- **Estado**: Solo reservas PENDING o CONFIRMED pueden cancelarse
- **Tiempo límite**: Puede configurarse tiempo mínimo antes de la fecha de reserva

### Seguridad General

- **Rate limiting**: 150 requests por 15 minutos (más permisivo que admin)
- **Sanitización**: Todos los inputs sanitizados
- **CORS**: Configurado para permitir apps móviles
- **Error messages**: No revelan información sensible

## 📊 Swagger / API Documentation

Acceder a la documentación interactiva en:

```
http://localhost:3003/api-docs
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
pnpm --filter server-user test
```

## 📝 Notas de Desarrollo

- El servidor escucha en el puerto definido en `.env` (default: 3003)
- Las rutas están prefijadas con `/api`
- Comparte base de datos MongoDB con `server-admin`
- Las reservas se crean con status `PENDING` por defecto
- Admin debe confirmarlas desde `server-admin`
- El cálculo de `totalPrice` se hace automáticamente: `pricePerHour * duration`
- MongoDB se conecta automáticamente al iniciar

## 🚀 Próximas Funcionalidades

- [ ] Filtros avanzados de búsqueda de campos (por precio, ubicación, amenities)
- [ ] Sistema de favoritos de campos
- [ ] Historial de reservas con paginación
- [ ] Notificaciones cuando una reserva es confirmada/rechazada
- [ ] Integración de pagos (Stripe / PayPal)
- [ ] Reviews y ratings de campos
- [ ] Búsqueda de compañeros para partidos (matchmaking)

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
