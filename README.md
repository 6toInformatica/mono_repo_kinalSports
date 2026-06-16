# KinalSports Monorepo

Plataforma de gestion y reservas de espacios deportivos construida con arquitectura de microservicios.

Repositorio remoto: `https://github.com/6toInformatica/mono_repo_kinalSports.git`  
Rama por defecto: `master`

## Arquitectura del Sistema

```
                    +------------------+       +-------------------+
                    |   client-admin   |       |   client-user     |
                    | React + Vite     |       | React Native Expo |
                    | :5173            |       | :8081             |
                    +--------+---------+       +---------+---------+
                             |                           |
              auth-service   |                           | auth-node
              server-admin |                           | server-user
                             v                           v
              +--------------+--------------+  +--------+---------+
              | auth-service (.NET) :5156   |  | auth-node :3007  |
              | PostgreSQL                  |  | PostgreSQL       |
              +--------------+--------------+  +--------+---------+
                             |                           |
                             v                           v
              +--------------+--------------+  +--------+---------+
              | server-admin :3009          |  | server-user :3008|
              | /kinalSportsAdmin/v1        |  | /kinalSportsUser/v1
              | MongoDB                     |  | MongoDB (compartida)
              +-----------------------------+  +------------------+
```

### Regla de consumo

| Stack   | Cliente            | Autenticacion       | API de negocio |
| ------- | ------------------ | ------------------- | -------------- |
| Admin   | client-admin       | auth-service (.NET) | server-admin   |
| Usuario | client-user (Expo) | auth-node (Node)    | server-user    |

Ambos servicios de autenticacion comparten PostgreSQL y emiten JWT compatibles con sus respectivos backends.

## Alcance funcional

| Actor   | Cliente      | Funcionalidades                              |
| ------- | ------------ | -------------------------------------------- |
| Admin   | client-admin | Campos, reservas, equipos, torneos, usuarios |
| Usuario | client-user  | Campos, reservas, equipos, torneos, perfil   |

## Estructura del Monorepo

```
kinalSports/
├── authentication-service/
│   ├── auth-node/          # Auth Node.js + PostgreSQL (stack movil/usuario)
│   └── auth-service/       # Auth .NET 8 + PostgreSQL (stack admin)
├── server-admin/           # API administrativa (MongoDB)
├── server-user/            # API publica de usuarios (MongoDB)
├── client-admin/           # Panel web admin (React + Vite)
├── client-user/            # App movil (React Native + Expo)
├── docker-compose.yml      # Orquestacion de todos los servicios
├── dockerfiles/            # Dockerfiles por servicio
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── package.json            # Configuracion raiz del monorepo
└── pnpm-workspace.yaml     # Definicion de workspaces (incluye client-user)
```

Nota: `client-user` esta en `pnpm-workspace.yaml` pero no en el array `workspaces` de `package.json`. Usa `pnpm --filter client-user` desde la raiz igualmente.

## Requisitos Previos

- **Node.js**: v18+ (LTS recomendado)
- **pnpm**: v8+
- **.NET SDK**: 8.0+ (para auth-service)
- **PostgreSQL**: 13+ (Docker usa `postgres:13`)
- **MongoDB**: 7+ (Docker usa `mongo:7`)
- **Docker + Docker Compose**: recomendado para levantar el stack completo
- **Git**: 2.30+

## Instalacion Global

```bash
git clone https://github.com/6toInformatica/mono_repo_kinalSports.git
cd kinalSports
pnpm install
# Husky se configura automaticamente tras la instalacion (script prepare)
```

## Docker (recomendado)

Levantar todos los servicios con los puertos por defecto:

```bash
# Opcional: copiar y ajustar variables de entorno para Docker
cp .env.docker .env.docker.local  # o editar .env.docker directamente

docker compose up --build
```

| Servicio           | Puerto host       | URL base                                    |
| ------------------ | ----------------- | ------------------------------------------- |
| postgres           | 5435              | `localhost:5435`                            |
| mongodb            | 27020             | `localhost:27020`                           |
| auth-service       | 5156              | `http://localhost:5156/api/v1`              |
| auth-node          | 3007              | `http://localhost:3007/api/v1`              |
| server-admin       | 3009              | `http://localhost:3009/kinalSportsAdmin/v1` |
| server-user        | 3008              | `http://localhost:3008/kinalSportsUser/v1`  |
| client-admin       | 5173              | `http://localhost:5173`                     |
| client-user (Expo) | 8081, 19000-19002 | Metro bundler                               |

Health checks utiles:

```bash
curl http://localhost:5156/health
curl http://localhost:3007/api/v1/health
curl http://localhost:3009/kinalSportsAdmin/v1/health
curl http://localhost:3008/kinalSportsUser/v1/health
```

## Variables de Entorno

Cada servicio tiene su propio `.env.example`. Copialo a `.env` y ajusta valores:

| Servicio     | Archivo                                                                                |
| ------------ | -------------------------------------------------------------------------------------- |
| auth-node    | `authentication-service/auth-node/.env.example`                                        |
| auth-service | `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json` |
| server-admin | `server-admin/.env.example`                                                            |
| server-user  | `server-user/.env.example`                                                             |
| client-admin | `client-admin/.env.example`                                                            |
| client-user  | `client-user/.env.example`                                                             |

Ejemplo minimo para desarrollo local (sin Docker):

```bash
# client-admin/.env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3009/kinalSportsAdmin/v1

# client-user/.env
EXPO_PUBLIC_AUTH_URL=http://localhost:3007/api/v1/auth
EXPO_PUBLIC_USER_URL=http://localhost:3008/kinalSportsUser/v1
```

## Scripts Disponibles

### Comandos globales (desde raiz)

```bash
pnpm lint          # Lint en server-*, auth-node y client-admin
pnpm format        # Formatear server-*
pnpm commit        # Commit interactivo con Commitizen
pnpm lint:changed  # ESLint sobre archivos staged
```

### Comandos por servicio

```bash
pnpm --filter auth-node dev
pnpm --filter auth-service dev
pnpm --filter server-admin dev
pnpm --filter server-user dev
pnpm --filter client-admin dev
pnpm --filter client-user start   # Expo (no tiene script dev)
```

### Ejecutar varios servicios Node en paralelo

```bash
pnpm -r --parallel --filter server-admin --filter server-user --filter auth-node run dev
```

## Flujo de Desarrollo Local (sin Docker)

```bash
# Terminal 1 - Auth .NET (admin)
pnpm --filter auth-service dev

# Terminal 2 - Auth Node (movil/usuario)
pnpm --filter auth-node dev

# Terminal 3 - Management API
pnpm --filter server-admin dev

# Terminal 4 - User API
pnpm --filter server-user dev

# Terminal 5 - Frontend Admin
pnpm --filter client-admin dev

# Terminal 6 - App movil
pnpm --filter client-user start
```

Asegurate de tener PostgreSQL y MongoDB corriendo localmente con las URIs configuradas en cada `.env`.

## Commit Conventions

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripcion>

Tipos: feat, fix, chore, docs, refactor, test, perf, ci, build, style
Scope: auth-node, auth-service, server-admin, server-user, client-admin, client-user
```

Ejemplos:

```bash
feat(server-admin): add tournament CRUD endpoints
fix(auth-node): correct JWT expiration handling
docs(readme): align ports with docker-compose
```

Los hooks de Husky ejecutan lint-staged y validacion de mensaje de commit. El primer commit en una rama huerfana omite el pre-commit automaticamente.

## Documentacion de Servicios

- [Auth Node (Node.js)](./authentication-service/auth-node/README.md)
- [Auth Service (.NET)](./authentication-service/auth-service/README.md)
- [Server Admin](./server-admin/README.md)
- [Server User](./server-user/README.md)
- [Client Admin](./client-admin/README.md)
- [Client User (Expo)](./client-user/README.md)

Guías de recreacion del auth-service (.NET):

- [GUIA_RAPIDA.md](./authentication-service/auth-service/GUIA_RAPIDA.md)
- [FLUJO_RECREACION_PASO_A_PASO.md](./authentication-service/auth-service/FLUJO_RECREACION_PASO_A_PASO.md)

## Tecnologias Principales

| Servicio     | Stack                                                |
| ------------ | ---------------------------------------------------- |
| auth-node    | Node.js, Express, PostgreSQL, Sequelize, JWT, Argon2 |
| auth-service | .NET 8, ASP.NET Core, PostgreSQL, Entity Framework   |
| server-admin | Node.js, Express, MongoDB, Mongoose                  |
| server-user  | Node.js, Express, MongoDB, Mongoose                  |
| client-admin | React 19, Vite, TailwindCSS, React Router, Zustand   |
| client-user  | React Native, Expo 55, React Navigation, Zustand     |

## Seguridad

- Argon2 (auth-node) y PBKDF2 (auth-service) para hashing de contrasenas
- JWT para autenticacion stateless
- Rate limiting en endpoints sensibles
- Helmet.js para headers de seguridad
- Validacion con express-validator / FluentValidation
- CORS configurado por entorno
- Token interno (`x-internal-token`) para comunicacion entre server-admin y server-user

## Autor

**Braulio Echeverria**

## Licencia

MIT
