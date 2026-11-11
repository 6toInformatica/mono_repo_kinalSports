# KinalSports Monorepo

Plataforma de gestion y reservas de espacios deportivos construida con arquitectura de microservicios.

Repositorio remoto: `https://github.com/6toInformatica/mono_repo_kinalSports.git`  
Rama por defecto: `master`

## Arquitectura del Sistema

```
   +------------------+  +--------------------+       +-------------------+
   |   client-admin   |  | client-admin-next  |       |   client-user     |
   | React + Vite     |  | Next.js 16 (BFF)   |       | React Native Expo |
   | :5173            |  | :3000              |       | :8081             |
   +--------+---------+  +---------+----------+       +---------+---------+
            |                      |                            |
            +----------+-----------+                            | auth-node
                       | auth-service / server-admin            | server-user
                       v                                        v
          +------------+----------------+            +---------+---------+
          | auth-service (.NET 10) :5156|            | auth-node :3007   |
          | PostgreSQL 18               |            | PostgreSQL 18     |
          +------------+----------------+            +---------+---------+
                       |                                        |
                       v                                        v
          +------------+----------------+            +---------+---------+
          | server-admin :3009          |            | server-user :3008 |
          | /kinalSportsAdmin/v1        |            | /kinalSportsUser/v1
          | MongoDB                     |            | MongoDB (compartida)
          +-----------------------------+            +-------------------+
```

### Regla de consumo

| Stack   | Cliente                          | Autenticacion       | API de negocio |
| ------- | -------------------------------- | ------------------- | -------------- |
| Admin   | client-admin / client-admin-next | auth-service (.NET) | server-admin   |
| Usuario | client-user (Expo)               | auth-node (Node)    | server-user    |

Ambos servicios de autenticacion comparten PostgreSQL (mismas tablas, mismo hash Argon2id, mismos claims JWT `sub`/`role`
y mismo secreto/issuer/audience), por lo que son **intercambiables**: si uno cae, el otro puede atender a cualquier usuario.

El esquema de PostgreSQL lo administran **solo las migraciones de EF Core** (servicio `auth-migrator` en Docker, que corre
antes de auth-service y auth-node). auth-node usa Prisma unicamente para leer el esquema (`prisma db pull`); nunca migra.

Los dos paneles admin tienen la misma funcionalidad y conviven contra los mismos backends:

- **client-admin** (React + Vite): guarda la sesion en el navegador.
- **client-admin-next** (Next.js): los tokens viven en cookies httpOnly. El navegador solo llama a rutas de Next
  (`/api/session`, `/api/backend/...`), que agregan el token, renuevan la sesion y protegen las paginas desde el servidor.
  Incluye ademas una vista general con indicadores del dia.

## Alcance funcional

| Actor   | Cliente                         | Funcionalidades                                                         |
| ------- | ------------------------------- | ----------------------------------------------------------------------- |
| Admin   | client-admin, client-admin-next | Canchas, reservas, equipos, torneos, usuarios (y vista general en Next) |
| Usuario | client-user                     | Canchas, reservas, equipos, torneos, perfil                             |

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
│   ├── auth-node/          # Auth Fastify + TypeScript + Prisma (stack movil/usuario)
│   └── auth-service/       # Auth .NET 10, Clean Architecture (stack admin, dueño del esquema)
├── server-admin/           # API administrativa, NestJS + TypeScript (MongoDB)
├── server-user/            # API de usuarios, Express por capas (MongoDB)
├── client-admin/           # Panel web admin (React + Vite)
├── client-admin-next/      # Panel web admin (Next.js 16, sesion con cookies httpOnly)
├── client-user/            # App movil (React Native + Expo SDK 58)
├── tests/contract/         # Pruebas de contrato HTTP (Vitest) de todas las rutas
├── scripts/seed/           # Datos de prueba
├── docker-compose.yml      # Orquestacion de todos los servicios
├── dockerfiles/            # Dockerfiles por servicio (multi-stage)
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── package.json            # Configuracion raiz del monorepo
└── pnpm-workspace.yaml     # Workspaces, overrides de seguridad y configuracion de audit
```

## Requisitos Previos

- **Node.js**: 22.13+ (`.nvmrc` fija 24 para desarrollo local; las imagenes de Docker usan Node 26)
- **pnpm**: 10 (version fijada en `packageManager`; Docker instala la misma)
- **.NET SDK**: 10.0 (para auth-service; version fijada en `global.json`)
- **PostgreSQL**: 18 (Docker usa `postgres:18`)
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

Las credenciales (PostgreSQL, JWT, SMTP, Cloudinary, token interno) se definen en `.env.docker` en la raiz (no se versiona).

```bash
pnpm docker:up            # equivale a: docker compose --env-file .env.docker up --build -V
pnpm docker:up:detached   # igual, en segundo plano
pnpm docker:logs          # seguir logs
pnpm docker:down          # detener
```

> `-V` recrea los volumenes anonimos de `node_modules`, para que una reconstruccion no use dependencias viejas.

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
| client-admin-next  | 3000              | `http://localhost:3000`                     |
| client-user (Expo) | 8081, 19000-19002 | Metro bundler                               |

Health checks utiles:

```bash
curl http://localhost:5156/health
curl http://localhost:3007/api/v1/health
curl http://localhost:3009/kinalSportsAdmin/v1/health
curl http://localhost:3008/kinalSportsUser/v1/health
```

En Windows, si un contenedor de desarrollo no detecta cambios en el codigo montado, reinicialo:
`docker compose restart <servicio>`.

## Variables de Entorno

Cada servicio tiene su propio `.env.example`. Copialo a `.env` y ajusta valores:

| Servicio          | Archivo                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| auth-node         | `authentication-service/auth-node/.env.example`                                                                                          |
| auth-service      | `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.example.json` (copiar a `appsettings.Development.json`) |
| server-admin      | `server-admin/.env.example`                                                                                                              |
| server-user       | `server-user/.env.example`                                                                                                               |
| client-admin      | `client-admin/.env.example`                                                                                                              |
| client-admin-next | `client-admin-next/.env.example` (copiar a `.env.local`)                                                                                 |
| client-user       | `client-user/.env.example`                                                                                                               |

Ejemplo minimo para desarrollo local (sin Docker):

```bash
# client-admin/.env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3009/kinalSportsAdmin/v1

# client-admin-next/.env.local (solo las lee el servidor de Next)
AUTH_API_URL=http://localhost:5156/api/v1
ADMIN_API_URL=http://localhost:3009/kinalSportsAdmin/v1

# client-user/.env (emulador Android: 10.0.2.2 apunta al localhost del host;
# en un dispositivo fisico usa la IP LAN de tu computadora)
EXPO_PUBLIC_AUTH_URL=http://10.0.2.2:3007/api/v1/auth
EXPO_PUBLIC_USER_URL=http://10.0.2.2:3008/kinalSportsUser/v1
```

`INTERNAL_SERVICE_TOKEN` debe tener el mismo valor en auth-node, server-admin y server-user, y en auth-service
como `InternalServiceToken` (en `appsettings.Development.json` o variable de entorno).

CORS (`ALLOWED_ORIGINS`, `ADMIN_ALLOWED_ORIGINS`) solo necesita los clientes que llaman a los backends desde el
navegador. client-admin-next llama desde su servidor, asi que no requiere CORS. `FRONTEND_URL` admite un solo valor:
los enlaces de los correos apuntan a client-admin (5173), y client-admin-next tiene las mismas rutas
`/verify-email` y `/reset-password` por si se cambia a 3000.

## Scripts Disponibles

### Comandos globales (desde raiz)

```bash
pnpm lint            # Lint en server-*, auth-node, client-admin y client-admin-next
pnpm format          # Formatear server-*
pnpm commit          # Commit interactivo con Commitizen
pnpm lint:changed    # ESLint sobre archivos staged
pnpm contract:up     # Stack para pruebas de contrato (Mailpit, rate limits altos)
pnpm db:seed         # Datos de prueba
pnpm test:contract   # Pruebas de contrato contra el stack levantado
```

### Comandos por servicio

```bash
pnpm --filter auth-node dev
pnpm --filter auth-service dev
pnpm --filter server-admin dev
pnpm --filter server-user dev
pnpm --filter @kinal/client-admin dev
pnpm --filter @kinal/client-admin-next dev
pnpm --filter client-user start   # Expo (no tiene script dev)
```

### Ejecutar varios servicios Node en paralelo

```bash
pnpm -r --parallel --filter server-admin --filter server-user --filter auth-node run dev
```

## Flujo de Desarrollo Local (sin Docker)

```bash
# Terminal 1 - Auth .NET (admin); aplica las migraciones de EF Core
pnpm --filter auth-service dev

# Terminal 2 - Auth Node (movil/usuario)
pnpm --filter auth-node dev

# Terminal 3 - Management API
pnpm --filter server-admin dev

# Terminal 4 - User API
pnpm --filter server-user dev

# Terminal 5 - Frontend Admin (uno o ambos)
pnpm --filter @kinal/client-admin dev
pnpm --filter @kinal/client-admin-next dev

# Terminal 6 - App movil
pnpm --filter client-user start
```

Asegurate de tener PostgreSQL y MongoDB corriendo localmente con las URIs configuradas en cada `.env`.

## Pruebas

Las pruebas de contrato (`tests/contract/`) cubren las rutas HTTP de los cuatro backends y fijan el status y la forma de
cada respuesta. Ver [tests/contract/README.md](./tests/contract/README.md).

```bash
pnpm contract:up && pnpm db:seed && pnpm test:contract
```

## Commit Conventions

Usamos [Conventional Commits](https://www.conventionalcommits.org/) (el asunto va en minusculas):

```
<tipo>(<scope>): <descripcion>

Tipos: feat, fix, chore, docs, refactor, test, perf, ci, build, style
Scope: auth-node, auth-service, server-admin, server-user, client-admin, client-admin-next, client-user
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
- [Client Admin Next](./client-admin-next/README.md)
- [Client User (Expo)](./client-user/README.md)

Guías de recreacion del auth-service (.NET):

- [GUIA_RAPIDA.md](./authentication-service/auth-service/GUIA_RAPIDA.md)
- [FLUJO_RECREACION_PASO_A_PASO.md](./authentication-service/auth-service/FLUJO_RECREACION_PASO_A_PASO.md)

## Tecnologias Principales

| Servicio          | Stack                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| auth-node         | Node.js, Fastify 5, TypeScript, Prisma 7 (PostgreSQL), JWT, Argon2      |
| auth-service      | .NET 10, ASP.NET Core, EF Core 10, Npgsql, Clean Architecture           |
| server-admin      | NestJS 12, TypeScript, MongoDB, Mongoose 9                              |
| server-user       | Node.js, Express 5, MongoDB, Mongoose 9 (controller/service/repository) |
| client-admin      | React 19, Vite 8, TailwindCSS, React Router, Zustand                    |
| client-admin-next | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4            |
| client-user       | React Native 0.88, Expo SDK 58, React Navigation, Zustand               |

## Seguridad

- Argon2id (mismos parametros en auth-node y auth-service) para hashing de contrasenas
- JWT HS256 de 15 minutos validando issuer y audience, con refresh tokens rotativos de 30 dias
- El reset de contrasena cierra todas las sesiones; un usuario desactivado no puede renovar su sesion
- client-admin-next: tokens en cookies httpOnly, chequeo de origen (CSRF) y renovacion de sesion en el servidor
- Rate limiting en endpoints sensibles
- Helmet / NetEscapades para headers de seguridad
- CORS restringido a los origenes configurados
- Token interno (`x-internal-token`) entre servicios: server-user -> server-admin, y server-admin/server-user ->
  `profile/by-id` / `profile/by-username` de los servicios de auth
- Los secretos no se versionan: van en `.env.docker` o en `appsettings.Development.json` (ambos ignorados por git)

## Autor

**Braulio Echeverria**

## Licencia

MIT
