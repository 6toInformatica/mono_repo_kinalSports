# KinalSports Monorepo

Plataforma integral de gestion y reservas de espacios deportivos construida con arquitectura de microservicios.

- **Repositorio remoto:** `https://github.com/6toInformatica/mono_repo_kinalSports.git`
- **Rama principal:** `master`

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Decisiones Arquitectonicas y Pedagogicas](#2-decisiones-arquitectonicas-y-pedagogicas)
3. [Estructura del Monorepo](#3-estructura-del-monorepo)
4. [Requisitos Previos](#4-requisitos-previos)
5. [Guia Paso a Paso: Levantar con Docker (Recomendado)](#5-guia-paso-a-paso-levantar-con-docker-recomendado)
6. [Guia Paso a Paso: Desarrollo Local (Sin Docker)](#6-guia-paso-a-paso-desarrollo-local-sin-docker)
7. [Puertos y Health Checks](#7-puertos-y-health-checks)
8. [Scripts Globales y por Servicio](#8-scripts-globales-y-por-servicio)
9. [Pruebas Unitarias y de Contrato](#9-pruebas-unitarias-y-de-contrato)
10. [Seguridad y Reglas de Negocio](#10-seguridad-y-reglas-de-negocio)
11. [Documentacion por Servicio](#11-documentacion-por-servicio)
12. [Contribucion, Seguridad y Licencia](#12-contribucion-seguridad-y-licencia)

---

## 1. Arquitectura del Sistema

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
          | PostgreSQL 18 + Redis 7     |            | PostgreSQL 18     |
          +------------+----------------+            +---------+---------+
                       |                                        |
                       v                                        v
          +------------+----------------+            +---------+---------+
          | server-admin :3009          |            | server-user :3008 |
          | /kinalSportsAdmin/v1        |            | /kinalSportsUser/v1
          | MongoDB 7 + Redis 7         |            | MongoDB 7 + Redis 7
          +-----------------------------+            +-------------------+
```

### Regla de consumo

| Stack       | Cliente                              | Autenticacion (Dev)      | Autenticacion (Prod)  | API de Negocio          |
| :---------- | :----------------------------------- | :----------------------- | :-------------------- | :---------------------- |
| **Admin**   | `client-admin` / `client-admin-next` | `auth-service` (.NET 10) | `auth-node` (Node.js) | `server-admin` (NestJS) |
| **Usuario** | `client-user` (Expo)                 | `auth-node` (Node.js)    | `auth-node` (Node.js) | `server-user` (Express) |

### Tecnologias por Servicio

| Servicio            | Stack                                                                                          |
| :------------------ | :--------------------------------------------------------------------------------------------- |
| `auth-node`         | Node.js 22+, Fastify 5, TypeScript, Prisma 7 (PostgreSQL 18), Redis Cache-Aside, JWT, Argon2id |
| `auth-service`      | .NET 10, ASP.NET Core, EF Core 10, Npgsql, Redis Cache-Aside, Clean Architecture               |
| `server-admin`      | NestJS 12, TypeScript, MongoDB 7, Mongoose 9, Redis Cache-Aside, HTTP `QUERY`                  |
| `server-user`       | Node.js 22+, Express 5, MongoDB 7, Mongoose 9, Redis Cache-Aside, HTTP `QUERY`                 |
| `client-admin`      | React 19, Vite 8, TailwindCSS 4, React Router 7, Zustand 5 (sesion con cookies `httpOnly`)     |
| `client-admin-next` | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4 (BFF con cookies `httpOnly`)      |
| `client-user`       | React Native 0.88, Expo SDK 58, React Navigation 7, Zustand 5 (`expo-secure-store`)            |

---

## 2. Decisiones Arquitectonicas y Pedagogicas

1. **Intercambiabilidad `.NET 10` ↔ `Node.js` (Desarrollo vs Produccion):**
   - **En clase y desarrollo (`docker-compose.yml`):** Corren simultaneamente `auth-service` (.NET 10, Clean Architecture) y `auth-node` (Fastify + TypeScript, Arquitectura Hexagonal) sobre la misma base PostgreSQL 18. Ambos usan los mismos parametros de Argon2id y firman el mismo JWT (`HS256`).
   - **En produccion (`docker-compose.prod.yml`):** Para desplegar en servidores sin runtime de Microsoft (.NET), `auth-node` asume el **100% de la autenticacion** (tanto movil como admin) e inicializa por si mismo el esquema PostgreSQL, los roles base y el administrador inicial sin depender de `auth-migrator`.
2. **Microservicios Independientes dentro de un Monorepo:**
   - Cada carpeta de servicio posee su propio `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `Dockerfile` multi-stage (`dev` y `runtime`), demostrando que cada servicio puede desarrollarse en un monorepo y desplegarse de manera autonoma.
3. **Seguridad de Sesion: Cookies `httpOnly` en Web vs `SecureStore` en Movil:**
   - En aplicaciones web (`client-admin` y `client-admin-next`), **nunca se guarda el JWT ni el refresh token en `localStorage`** (vulnerable a robo de sesion mediante XSS). Ambos paneles operan con **cookies `httpOnly`** (`kinal_access` y `kinal_refresh`).
   - En la app movil (`client-user`), donde no aplica el modelo de cookies de navegador, los tokens se guardan en el llavero nativo cifrado del sistema operativo (`expo-secure-store`).
4. **Caché Distribuida `Cache-Aside` con Redis (`redis:7-alpine`):**
   - `auth-node`, `auth-service`, `server-admin` y `server-user` comparten Redis para cachear perfiles (`kinal:user:profile:<id>`, TTL 60 s) y el catalogo de canchas (`kinal:fields:*`, TTL 120 s), con **invalidacion automatica entre microservicios** al cambiar fotos, roles o canchas, y degradacion elegante a memoria local si `REDIS_URL` no esta definido.
5. **Metodo HTTP `QUERY` (IETF Safe Method with Body):**
   - Para consultas de solo lectura que requieren enviar criterios o identificadores en el cuerpo JSON sin exponerlos en la URL ni abusar de `POST`, se implementa el metodo `QUERY` en `/api/v1/auth/profile/by-id`, `/api/v1/auth/profile/by-username` y `/fields` (`server-admin` y `server-user`).

---

## 3. Estructura del Monorepo

```
kinalSports/
├── authentication-service/
│   ├── auth-node/          # Auth Fastify + TypeScript + Prisma (PostgreSQL + Redis)
│   └── auth-service/       # Auth .NET 10, Clean Architecture (PostgreSQL + Redis)
├── server-admin/           # API administrativa, NestJS + TypeScript (MongoDB + Redis)
├── server-user/            # API de usuarios, Express 5 por capas (MongoDB + Redis)
├── client-admin/           # Panel web admin SPA (React 19 + Vite 8, cookies httpOnly)
├── client-admin-next/      # Panel web admin BFF (Next.js 16, cookies httpOnly)
├── client-user/            # App movil (React Native + Expo SDK 58, SecureStore)
├── tests/contract/         # Pruebas de contrato HTTP E2E (Vitest)
├── scripts/seed/           # Datos iniciales (usuarios, canchas, equipos, torneos, reservas)
├── docker-compose.yml      # Orquestacion de desarrollo (.NET 10 + Node.js + Postgres + Mongo + Redis)
├── docker-compose.prod.yml # Orquestacion de produccion (100% Node.js + Postgres + Mongo + Redis)
├── dockerfiles/            # Dockerfiles multi-stage por servicio (etapas dev y runtime)
├── .husky/                 # Git hooks (pre-commit con lint-staged + dotnet format, commit-msg)
├── package.json            # Scripts globales del monorepo
└── pnpm-workspace.yaml     # Workspaces, overrides de seguridad y allowBuilds
```

---

## 4. Requisitos Previos

- **Node.js:** `>=22.13.0` (`.nvmrc` fija Node 24 para local; los contenedores usan Node 26)
- **pnpm:** `10+`
- **.NET SDK:** `10.0.x` (requerido para `auth-service` en desarrollo; no requerido en `docker-compose.prod.yml`)
- **PostgreSQL:** `18` (Docker usa `postgres:18`)
- **MongoDB:** `7+` (Docker usa `mongo:7`)
- **Redis:** `7+` (Docker usa `redis:7-alpine`; opcional en local gracias al fallback en memoria)
- **Docker + Docker Compose:** Recomendado para levantar todo el ecosistema con un solo comando

---

## 5. Guia Paso a Paso: Levantar con Docker (Recomendado)

### Paso 1: Clonar e instalar dependencias

```bash
git clone https://github.com/6toInformatica/mono_repo_kinalSports.git
cd kinalSports
pnpm install
```

### Paso 2: Configurar `.env.docker` (opcional en desarrollo, obligatorio en produccion)

Crea un archivo `.env.docker` en la raiz (ignorado por Git) para definir credenciales de correo (Kinal Mail Hub) y Cloudinary, o secretos de produccion:

```env
# Requeridos en docker-compose.prod.yml (en desarrollo tienen valores por defecto)
POSTGRES_USER=KinalSports
POSTGRES_PASSWORD=TuPasswordSeguroPostgres!
JWT_SECRET=UnaClaveSecretaDeAlMenos32CaracteresParaHS256!
INTERNAL_SERVICE_TOKEN=TokenInternoEntreMicroservicios2026!
SEED_ADMIN_PASSWORD=Admin1234!

# Kinal Mail Hub (API REST de correo)
KMH_PROJECT_API_KEY=<tu-api-key-de-kmh>

# Cloudinary (subida de imagenes de perfil, canchas y equipos)
CLOUDINARY_CLOUD_NAME=b3xvlule
CLOUDINARY_API_KEY=<tu-api-key>
CLOUDINARY_API_SECRET=<tu-api-secret>
```

> **Nota sobre Kinal Mail Hub:** `mail.lab.kinal.edu.gt` solo existe en el DNS interno del colegio; `docker-compose.yml` lo resuelve mediante `extra_hosts` (`181.114.7.76`, configurable con `KMH_HOST_IP`). Con `MAIL_PROVIDER=smtp` se puede alternar a SMTP/Mailpit.

### Paso 3A: Iniciar en modo Desarrollo (incluye `.NET 10` y `Node.js`)

```bash
pnpm docker:up            # Construye y levanta en primer plano
pnpm docker:up:detached   # Construye y levanta en segundo plano (-d)
pnpm db:seed              # Pobla usuarios, canchas, equipos, torneos y reservas de prueba
```

### Paso 3B: Iniciar en modo Produccion (100% `Node.js`, sin `.NET`)

```bash
pnpm docker:prod:up       # Usa docker-compose.prod.yml (etapas runtime, auth-node al 100%)
pnpm docker:prod:logs     # Ver logs de produccion
pnpm docker:prod:down     # Detener contenedores de produccion
```

---

## 6. Guia Paso a Paso: Desarrollo Local (Sin Docker)

### Paso 1: Copiar archivos `.env` de cada servicio

| Servicio            | Archivo plantilla                                                                              | Archivo destino                                                                        |
| :------------------ | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `auth-node`         | `authentication-service/auth-node/.env.example`                                                | `authentication-service/auth-node/.env`                                                |
| `auth-service`      | `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.example.json` | `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json` |
| `server-admin`      | `server-admin/.env.example`                                                                    | `server-admin/.env`                                                                    |
| `server-user`       | `server-user/.env.example`                                                                     | `server-user/.env`                                                                     |
| `client-admin`      | `client-admin/.env.example`                                                                    | `client-admin/.env`                                                                    |
| `client-admin-next` | `client-admin-next/.env.example`                                                               | `client-admin-next/.env.local`                                                         |
| `client-user`       | `client-user/.env.example`                                                                     | `client-user/.env`                                                                     |

> **Importante:** `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN` deben tener exactamente el mismo valor en `auth-node`, `auth-service`, `server-admin` y `server-user`.

### Paso 2: Levantar los servicios

```bash
# Terminal 1 - Auth .NET (opcional si usas solo auth-node, ya que auth-node tambien inicializa el esquema)
pnpm --filter auth-service dev

# Terminal 2 - Auth Node
pnpm --filter auth-node dev

# Terminal 3 - Server Admin (NestJS)
pnpm --filter server-admin dev

# Terminal 4 - Server User (Express)
pnpm --filter server-user dev

# Terminal 5 - Panel Admin (elige Vite o Next.js, o ambos)
pnpm --filter @kinal/client-admin dev
pnpm --filter @kinal/client-admin-next dev

# Terminal 6 - App Movil (Expo)
pnpm --filter client-user start
```

---

## 7. Puertos y Health Checks

| Servicio              | Puerto Host | URL Base / Conexion                         | Health Check                                           |
| :-------------------- | :---------- | :------------------------------------------ | :----------------------------------------------------- |
| `postgres`            | `5435`      | `localhost:5435`                            | `pg_isready`                                           |
| `mongodb`             | `27020`     | `mongodb://localhost:27020/kinalSports`     | `mongosh ping`                                         |
| `redis`               | `6379`      | `redis://localhost:6379`                    | `redis-cli ping`                                       |
| `auth-service` (.NET) | `5156`      | `http://localhost:5156/api/v1`              | `GET http://localhost:5156/health`                     |
| `auth-node`           | `3007`      | `http://localhost:3007/api/v1`              | `GET http://localhost:3007/api/v1/health`              |
| `server-admin`        | `3009`      | `http://localhost:3009/kinalSportsAdmin/v1` | `GET http://localhost:3009/kinalSportsAdmin/v1/health` |
| `server-user`         | `3008`      | `http://localhost:3008/kinalSportsUser/v1`  | `GET http://localhost:3008/kinalSportsUser/v1/health`  |
| `client-admin`        | `5173`      | `http://localhost:5173`                     | —                                                      |
| `client-admin-next`   | `3000`      | `http://localhost:3000`                     | —                                                      |
| `client-user`         | `8081`      | Metro Bundler (`19000-19002`)               | —                                                      |

---

## 8. Scripts Globales y por Servicio

```bash
# Calidad y pruebas (desde la raiz)
pnpm test                 # Ejecuta las 275 pruebas unitarias (Node.js + .NET 10)
pnpm lint                 # Ejecuta ESLint en todos los proyectos JS/TS
pnpm format               # Formatea codigo con Prettier
pnpm commit               # Asistente interactivo de Conventional Commits (Commitizen)

# Datos de prueba y pruebas E2E de contrato
pnpm db:seed              # Siembra datos iniciales de forma idempotente
pnpm db:reset             # Limpia las bases y vuelve a sembrar desde cero
pnpm contract:up          # Levanta el stack con Mailpit para pruebas de contrato
pnpm test:contract        # Ejecuta la suite de pruebas de contrato HTTP
```

---

## 9. Pruebas Unitarias y de Contrato

1. **Pruebas Unitarias (`pnpm test`):**
   - Cada paquete cuenta con su propia bateria de pruebas aisladas (Vitest en Node/React/Next, Jest en Expo React Native y xUnit v3 en .NET 10). No requieren bases de datos ni contenedores levantados.
2. **Pruebas de Contrato HTTP (`tests/contract/`):**
   - Verifican de caja negra que `auth-node` y `auth-service` respondan con el mismo contrato, y validan los flujos completos de `server-admin` y `server-user`. Ver [tests/contract/README.md](./tests/contract/README.md).

---

## 10. Seguridad y Reglas de Negocio

### Seguridad

- **Hashing:** Argon2id con parametros identicos entre Node.js y .NET 10.
- **Tokens y Sesiones:** JWT `HS256` (15 min) + Refresh Token opaco rotativo (30 dias). Reutilizar un refresh token rotado revoca toda la familia de sesion.
- **Cookies `httpOnly` en Web:** `kinal_access` y `kinal_refresh` viajan con `HttpOnly; SameSite=Lax; Path=/` (y `Secure` en produccion). Ningun frontend web guarda tokens en `localStorage`.
- **Autorizacion y Anti-IDOR:** Verificacion de roles en cada endpoint administrativo y proteccion de `GET /api/v1/users/:userId/roles` (solo propio usuario o `ADMIN_ROLE`).

### Reglas de Negocio

| Modulo            | Regla                                                                                                                      |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Reservas**      | Inicio en el futuro, cancha existente y activa, duracion de 1 a 3 horas, horario `06:00` a `22:00` (`America/Guatemala`).  |
| **Cancelaciones** | El usuario solo cancela reservas `PENDING`/`CONFIRMED` que aun no inician; el admin no confirma reservas ya iniciadas.     |
| **Equipos**       | No se permite unirse a equipos inactivos; cupo maximo de miembros: `12` (`FUTBOL_7`) y `18` (`FUTBOL_11`).                 |
| **Torneos**       | Inscripcion exclusiva por el capitan, con equipo activo, torneo activo en `PENDIENTE` sin iniciar y de la misma categoria. |

---

## 11. Documentacion por Servicio

Todos los READMEs de los microservicios y clientes siguen una estructura uniforme (Rol, Stack, Estructura, Instalacion, Variables de Entorno, Scripts, Arquitectura/Seguridad y Endpoints):

- [Auth Node (Fastify + TypeScript)](./authentication-service/auth-node/README.md)
- [Auth Service (.NET 10 Clean Architecture)](./authentication-service/auth-service/README.md)
  - [Guia Rapida de Recreacion (.NET)](./authentication-service/auth-service/GUIA_RAPIDA.md)
  - [Flujo de Recreacion Paso a Paso (.NET)](./authentication-service/auth-service/FLUJO_RECREACION_PASO_A_PASO.md)
- [Server Admin (NestJS + MongoDB)](./server-admin/README.md)
- [Server User (Express 5 + MongoDB)](./server-user/README.md)
- [Client Admin (React + Vite)](./client-admin/README.md)
- [Client Admin Next (Next.js 16 BFF)](./client-admin-next/README.md)
- [Client User (React Native + Expo)](./client-user/README.md)
- [Pruebas de Contrato](./tests/contract/README.md)

---

## 12. Contribucion, Seguridad y Licencia

Este repositorio sigue los estandares de gobernanza y calidad de proyectos profesionales de codigo abierto:

- **[Guia de Contribucion (`CONTRIBUTING.md`)](./CONTRIBUTING.md):** Flujo de ramas, convencion de commits (`Conventional Commits` / `pnpm commit`), hooks de Husky, reglas de arquitectura y ejecucion de pruebas.
- **[Politica de Seguridad (`SECURITY.md`)](./SECURITY.md):** Controles de seguridad implementados, manejo de secretos (`.env` / `.env.docker`) y proceso de reporte responsable de vulnerabilidades.
- **[Codigo de Conducta (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md):** Estandares de convivencia academica y profesional basados en Contributor Covenant 2.1.
- **[Licencia MIT (`LICENSE`)](./LICENSE):** Distribuido bajo la licencia **MIT** — Copyright (c) 2026 **Braulio Echeverria** (Centro Educativo Tecnico Laboral Kinal, Guatemala).
