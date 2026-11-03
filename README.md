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

Ambos servicios de autenticacion comparten PostgreSQL (mismas tablas, mismo hash Argon2id, mismos claims JWT `sub`/`role`
y mismo secreto/issuer/audience), por lo que son **intercambiables**: si uno cae, el otro puede atender a cualquier usuario.
El esquema lo crea auth-service (EF Core `EnsureCreated`); auth-node solo crea tablas faltantes y no altera las existentes.

## Alcance funcional

| Actor   | Cliente      | Funcionalidades                              |
| ------- | ------------ | -------------------------------------------- |
| Admin   | client-admin | Campos, reservas, equipos, torneos, usuarios |
| Usuario | client-user  | Campos, reservas, equipos, torneos, perfil   |

### Reglas de negocio

| Modulo   | Regla                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reservas | Inicio en el futuro, cancha existente y activa, duracion de 1 a 3 horas, horario 06:00-22:00 (`America/Guatemala`, configurable con `BUSINESS_TIMEZONE`) |
| Reservas | El usuario cancela solo reservas `PENDING`/`CONFIRMED` que aun no inician; el admin no confirma reservas ya iniciadas                                    |
| Equipos  | No se puede unir a equipos inactivos; cupo de miembros: 12 (`FUTBOL_7`) y 18 (`FUTBOL_11`)                                                               |
| Torneos  | Inscripcion solo por el capitan, con equipo activo, torneo activo en `PENDIENTE` sin iniciar y misma categoria                                           |

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

Las credenciales (PostgreSQL, JWT, SMTP, Cloudinary, token interno) se definen en `.env.docker` en la raiz (no se versiona).

```bash
pnpm docker:up            # equivale a: docker compose --env-file .env.docker up --build
pnpm docker:up:detached   # igual, en segundo plano
pnpm docker:logs          # seguir logs
pnpm docker:down          # detener
```

> Importante: `docker compose up` sin `--env-file .env.docker` NO usa ese archivo para resolver
> las variables `${...}` del compose (Compose solo lee `.env` automaticamente), por lo que se
> aplicarian los valores por defecto y las credenciales de SMTP/Cloudinary quedarian vacias.

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

| Servicio     | Archivo                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| auth-node    | `authentication-service/auth-node/.env.example`                                                                                          |
| auth-service | `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.example.json` (copiar a `appsettings.Development.json`) |
| server-admin | `server-admin/.env.example`                                                                                                              |
| server-user  | `server-user/.env.example`                                                                                                               |
| client-admin | `client-admin/.env.example`                                                                                                              |
| client-user  | `client-user/.env.example`                                                                                                               |

Ejemplo minimo para desarrollo local (sin Docker):

```bash
# client-admin/.env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3009/kinalSportsAdmin/v1

# client-user/.env (emulador Android: 10.0.2.2 apunta al localhost del host;
# en un dispositivo fisico usa la IP LAN de tu computadora)
EXPO_PUBLIC_AUTH_URL=http://10.0.2.2:3007/api/v1/auth
EXPO_PUBLIC_USER_URL=http://10.0.2.2:3008/kinalSportsUser/v1
```

`INTERNAL_SERVICE_TOKEN` debe tener el mismo valor en auth-node, server-admin y server-user, y en auth-service
como `InternalServiceToken` (en `appsettings.Development.json` o variable de entorno).

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

- Argon2id (mismos parametros en auth-node y auth-service) para hashing de contrasenas
- JWT HS256 de 15 minutos validando issuer y audience, con refresh tokens rotativos de 30 dias
- El reset de contrasena cierra todas las sesiones; un usuario desactivado no puede renovar su sesion
- Rate limiting en endpoints sensibles
- Helmet.js / NetEscapades para headers de seguridad
- Validacion con express-validator y DataAnnotations
- Token interno (`x-internal-token`) entre servicios: server-user -> server-admin, y server-admin/server-user ->
  `profile/by-id` / `profile/by-username` de los servicios de auth
- Los secretos no se versionan: van en `.env.docker` o en `appsettings.Development.json` (ambos ignorados por git)

## Autor

**Braulio Echeverria**

## Licencia

MIT
