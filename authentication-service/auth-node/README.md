# Auth Node - Servicio de Autenticacion (Node.js)

API RESTful de autenticacion construida con Node.js, Express y PostgreSQL.

## Rol en la arquitectura

Servicio de autenticacion del **stack movil/usuario**:

- Consumido por **client-user** (login, registro, refresh)
- Validado por **server-user** (JWT)
- Paralelo a **auth-service** (.NET), que atiende el stack admin

Ambos servicios comparten PostgreSQL y emiten JWT con configuracion compatible.

## Descripcion

Registro, login, gestion de perfiles, verificacion de email, recuperacion de contrasenas y administracion de roles. Usa JWT stateless y Argon2 para hashing.

## Tech Stack

- **Node.js** 18+ (ESM), **Express** 5.x
- **PostgreSQL** + **Sequelize** 6.x
- **JWT**, **Argon2**, **Cloudinary**, **Nodemailer**
- **Helmet**, **CORS**, **Rate Limiting**

## Instalacion

```bash
pnpm install
cd authentication-service/auth-node
cp .env.example .env
pnpm dev
```

Desde la raiz:

```bash
pnpm --filter auth-node dev
```

## Variables de Entorno

Ver `.env.example`. Valores clave:

```env
NODE_ENV=development
PORT=3000                    # local; Docker usa 3007
DATABASE_URL=postgresql://user:pass@localhost:5432/kinal_sports
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.example.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

## Estructura

```
auth-node/
├── configs/
├── helpers/
├── middlewares/
├── src/
│   ├── auth/          # auth.routes.js, auth.controller.js
│   └── users/         # user.routes.js (roles admin)
└── index.js
```

## Scripts

```bash
pnpm --filter auth-node dev
pnpm --filter auth-node start
pnpm --filter auth-node lint
pnpm --filter auth-node lint:fix
pnpm --filter auth-node format
```

## Endpoints

**Prefijo:** `/api/v1`  
**Puerto Docker:** `3007`  
**Health:** `GET /api/v1/health`

### Autenticacion (`/api/v1/auth`)

| Metodo | Endpoint                       | Descripcion                       | Auth |
| ------ | ------------------------------ | --------------------------------- | ---- |
| POST   | `/auth/refresh`                | Renovar access token              | No   |
| POST   | `/auth/logout`                 | Cerrar sesion (invalidar refresh) | No   |
| POST   | `/auth/register`               | Registrar usuario (multipart)     | No   |
| POST   | `/auth/login`                  | Iniciar sesion                    | No   |
| POST   | `/auth/verify-email`           | Verificar email                   | No   |
| POST   | `/auth/resend-verification`    | Reenviar verificacion             | No   |
| POST   | `/auth/forgot-password`        | Solicitar reset                   | No   |
| POST   | `/auth/reset-password`         | Resetear contrasena               | No   |
| GET    | `/auth/profile`                | Perfil del usuario autenticado    | JWT  |
| POST   | `/auth/profile/picture`        | Actualizar foto (multipart)       | JWT  |
| POST   | `/auth/profile/picture/avatar` | Alias de avatar (multipart)       | JWT  |
| POST   | `/auth/profile/by-id`          | Perfil por userId                 | No   |
| POST   | `/auth/profile/by-username`    | Perfil por username               | No   |

### Usuarios / roles (`/api/v1/users`)

| Metodo | Endpoint                   | Descripcion      | Auth  |
| ------ | -------------------------- | ---------------- | ----- |
| PUT    | `/users/:userId/role`      | Actualizar rol   | Admin |
| GET    | `/users/:userId/roles`     | Roles de usuario | Admin |
| GET    | `/users/by-role/:roleName` | Usuarios por rol | Admin |

## Ejemplos

**Registro:**

```bash
curl -X POST http://localhost:3007/api/v1/auth/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "password=SecurePass123!" \
  -F "name=John" \
  -F "surname=Doe" \
  -F "phone=12345678"
```

**Login:**

```bash
curl -X POST http://localhost:3007/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"john@example.com","password":"SecurePass123!"}'
```

**Perfil:**

```bash
curl http://localhost:3007/api/v1/auth/profile \
  -H "Authorization: Bearer <token>"
```

## Roles

- **USER** (default al registrarse)
- **ADMIN_ROLE** (administrador)
- Otros roles segun seeds en PostgreSQL

## Dependencias

| Consumidor  | Uso                                        |
| ----------- | ------------------------------------------ |
| client-user | Login, registro, refresh                   |
| server-user | Validacion JWT y enriquecimiento de perfil |

## Autor

**Braulio Echeverria**

## Licencia

MIT
