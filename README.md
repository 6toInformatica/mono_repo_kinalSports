# KinalSports Monorepo

Plataforma de gestión y reservas de espacios deportivos construida con arquitectura de microservicios.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Web Admin     │      │   Mobile User    │      │                 │
│   (React)       │──────│   (React)        │──────│                 │
└─────────────────┘      └──────────────────┘      │                 │
         │                        │                 │                 │
         └────────────────────────┼─────────────────│  Auth Services  │
                                  │                 │  (.NET + Node)  │
         ┌────────────────────────┼─────────────────│   PostgreSQL    │
         │                        │                 │                 │
         │                        │                 └─────────────────┘
         ▼                        ▼                           │
┌─────────────────┐      ┌──────────────────┐               │
│ Management API  │      │ Engagement API   │◄──────────────┘
│  (Node/Express) │      │  (Node/Express)  │
│    MongoDB      │      │    MongoDB       │
└─────────────────┘      └──────────────────┘
```

## 📂 Estructura del Monorepo

```
kinalSports/
├── authentication-service/
│   ├── auth-node/          # API autenticación Node.js + PostgreSQL
│   └── auth-service/       # API autenticación .NET Core + PostgreSQL
├── server-admin/           # API gestión administrativa (MongoDB)
├── server-user/            # API pública de usuarios (MongoDB)
├── client-admin/           # Frontend administrativo (React + Vite)
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── package.json            # Configuración raíz del monorepo
└── pnpm-workspace.yaml     # Definición de workspaces
```

## 🚀 Requisitos Previos

- **Node.js**: v18+ (LTS recomendado)
- **pnpm**: v8+ (gestor de paquetes)
- **.NET SDK**: 8.0+ (para auth-service)
- **PostgreSQL**: 14+ (para servicios de autenticación)
- **MongoDB**: 6.0+ (para servicios de gestión)
- **Git**: 2.30+

## 📦 Instalación Global

```bash
# Clonar repositorio
git clone <repository-url>
cd kinalSports

# Instalar todas las dependencias del monorepo
pnpm install

# Husky se configura automáticamente tras la instalación
```

## ⚙️ Variables de Entorno

Cada servicio requiere su propio archivo `.env`. Consulta el README de cada servicio para variables específicas.

**Ejemplo básico:**

```bash
# authentication-service/auth-node/.env
DATABASE_URL=postgresql://user:password@localhost:5432/kinalsports_auth
JWT_SECRET=tu-secret-key
PORT=3001

# server-admin/.env
MONGODB_URI=mongodb://localhost:27017/kinalsports_admin
AUTH_SERVICE_URL=http://localhost:3001
PORT=3002
```

## 🎯 Scripts Disponibles

### Comandos Globales (desde raíz)

```bash
# Lint en todos los servicios
pnpm lint

# Formatear código en servicios Node
pnpm format

# Commit interactivo con Commitizen
pnpm commit

# Lint solo archivos staged
pnpm lint:changed
```

### Comandos por Servicio (filtros)

```bash
# Desarrollo
pnpm --filter auth-node dev
pnpm --filter server-admin dev
pnpm --filter server-user dev
pnpm --filter client-admin dev

# Build
pnpm --filter client-admin build
pnpm --filter auth-service build

# Tests
pnpm --filter auth-node test
```

### Comando Multi-Servicio

```bash
# Ejecutar comando en todos los server-*
pnpm -r --filter './server-*' run dev

# Ejecutar en paralelo
pnpm -r --parallel run dev
```

## 🔧 Flujo de Desarrollo

1. **Crear rama feature:**

   ```bash
   git checkout -b feat/nombre-feature
   ```

2. **Hacer cambios y stage:**

   ```bash
   git add .
   ```

3. **Commit (hooks automáticos):**
   - Pre-commit ejecuta: Prettier → ESLint fix → lint-staged
   - Commit-msg valida formato convencional

   ```bash
   git commit -m "feat(server-admin): agregar endpoint de torneos"
   # O usar: pnpm commit (asistente interactivo)
   ```

4. **Push y PR:**
   ```bash
   git push origin feat/nombre-feature
   ```

## Commit Conventions

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

Tipos: feat, fix, chore, docs, refactor, test, perf, ci, build, style
Scope: auth-node, server-admin, client-admin, etc.
```

**Ejemplos:**

```bash
feat(server-admin): add tournament CRUD endpoints
fix(auth-node): correct JWT expiration handling
chore(deps): update mongoose to v8.19
docs(readme): add API documentation
```

## 🧪 Testing

```bash
# Ejecutar tests de un servicio específico
pnpm --filter auth-node test

# Tests de todos los servicios
pnpm -r run test
```

## 🏃 Ejecutar el Sistema Completo

```bash
# Terminal 1 - Auth Node
pnpm --filter auth-node dev

# Terminal 2 - Management API
pnpm --filter server-admin dev

# Terminal 3 - Engagement API
pnpm --filter server-user dev

# Terminal 4 - Frontend Admin
pnpm --filter client-admin dev
```

## 📚 Documentación de Servicios

- [Auth Node (Node.js)](./authentication-service/auth-node/README.md)
- [Auth Service (.NET)](./authentication-service/auth-service/README.md)
- [Server Admin](./server-admin/README.md)
- [Server User](./server-user/README.md)
- [Client Admin](./client-admin/README.md)

## 🛠️ Tecnologías Principales

| Servicio     | Stack                                                |
| ------------ | ---------------------------------------------------- |
| auth-node    | Node.js, Express, PostgreSQL, Sequelize, JWT, Argon2 |
| auth-service | .NET 8, ASP.NET Core, PostgreSQL, Entity Framework   |
| server-admin | Node.js, Express, MongoDB, Mongoose                  |
| server-user  | Node.js, Express, MongoDB, Mongoose                  |
| client-admin | React 19, Vite, TailwindCSS, React Router            |

## 🔐 Seguridad

- Argon2 para hashing de contraseñas
- JWT para autenticación stateless
- Rate limiting en endpoints sensibles
- Helmet.js para headers de seguridad
- Validación exhaustiva con express-validator
- CORS configurado por entorno

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
