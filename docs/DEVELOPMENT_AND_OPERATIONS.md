# Guía de Desarrollo, Operación, Pruebas y Solución de Problemas

**KinalSports · Fundación Kinal · 6to. Perito en Computación**

Este documento centraliza los procedimientos operativos transversales del monorepo **KinalSports**: configuración de entornos, matriz de puertos, uso de scripts globales, ejecución de pruebas, despliegue en producción y diagnóstico de errores frecuentes (_Troubleshooting_).

---

## Índice de Navegación

1. [Matriz de Puertos y Contenedores del Monorepo](#1-matriz-de-puertos-y-contenedores-del-monorepo)
2. [Referencia de Scripts Globales](#2-referencia-de-scripts-globales)
3. [Sembrado y Reinicio de Datos](#3-sembrado-y-reinicio-de-datos)
4. [Despliegue en Entorno de Producción](#4-despliegue-en-entorno-de-producción)
5. [Estrategia de Pruebas Automatizadas](#5-estrategia-de-pruebas-automatizadas)
6. [Solución de Problemas Frecuentes (_Troubleshooting_)](#6-solución-de-problemas-frecuentes-troubleshooting)
7. [Documentación Relacionada](#7-documentación-relacionada) (incluye [despliegue institucional](./INSTITUTIONAL_DEPLOYMENT.md))

---

## 1. Matriz de Puertos y Contenedores del Monorepo

| Componente              | Nombre de Contenedor                   | Puerto en Host (Por Defecto)    | Puerto Interno                     | Variable de Sobrescritura en `.env.docker` | Endpoint de Salud (`Healthcheck`)                                                       |
| :---------------------- | :------------------------------------- | :------------------------------ | :--------------------------------- | :----------------------------------------- | :-------------------------------------------------------------------------------------- |
| **PostgreSQL 18**       | `pg-kinal-sports`                      | `5435`                          | `5432`                             | `POSTGRES_PORT`                            | `pg_isready -U KinalSports -d kinal_sports`                                             |
| **MongoDB 7**           | `kinal_mongodb`                        | `27020`                         | `27017`                            | `MONGODB_PORT`                             | `mongosh --eval "db.adminCommand('ping')"`                                              |
| **Redis 7**             | `kinal_redis`                          | `6379`                          | `6379`                             | `REDIS_PORT`                               | `redis-cli ping`                                                                        |
| **`auth-migrator`**     | `kinal_auth_migrator`                  | _(Sin puerto)_                  | _(Efímero)_                        | —                                          | Finaliza con código `0` tras aplicar migraciones EF Core (solo en `docker-compose.yml`) |
| **`auth-service`**      | `kinal_auth_service`                   | `5156`                          | `5156`                             | `AUTH_SERVICE_PORT`                        | `GET http://localhost:5156/health` (solo en `docker-compose.yml`)                       |
| **`auth-node`**         | `kinal_auth_node`                      | `3007`                          | `3007`                             | `AUTH_NODE_PORT`                           | `GET http://localhost:3007/api/v1/health`                                               |
| **`server-admin`**      | `kinal_server_admin`                   | `3009`                          | `3009`                             | `SERVER_ADMIN_PORT`                        | `GET http://localhost:3009/kinalSportsAdmin/v1/health`                                  |
| **`server-user`**       | `kinal_server_user`                    | `3008`                          | `3008`                             | `SERVER_USER_PORT`                         | `GET http://localhost:3008/kinalSportsUser/v1/health`                                   |
| **`client-admin`**      | `kinal_client_admin`                   | `5173`                          | `5173` (dev) / `8080` (prod Nginx) | `CLIENT_ADMIN_PORT`                        | `http://localhost:5173`                                                                 |
| **`client-admin-next`** | `kinal_client_admin_next`              | `3000`                          | `3000`                             | `CLIENT_ADMIN_NEXT_PORT`                   | `http://localhost:3000`                                                                 |
| **`client-user`**       | `kinal_client_user`                    | `8081`, `19000-19002`           | `8081`, `19000-19002`              | `CLIENT_USER_METRO_PORT`                   | Metro Bundler en `http://localhost:8081` (solo en `docker-compose.yml`)                 |
| **Mailpit (Contract)**  | _(Definido en `compose.contract.yml`)_ | `8025` (UI/API) / `1025` (SMTP) | `8025` / `1025`                    | —                                          | `http://localhost:8025` (solo con `pnpm contract:up`)                                   |

---

## 2. Referencia de Scripts Globales

Todos los comandos siguientes están definidos en el archivo `package.json` de la raíz del monorepo:

| Script                    | Comando Ejecutado                                                                                                                                                                               | Descripción                                                                                                                                                                       |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`               | `pnpm -r --filter=!@kinal/contract-tests --if-present test`                                                                                                                                     | Ejecuta todas las pruebas unitarias de los 7 componentes (Node.js, React, React Native y `.NET 10`) sin requerir Docker.                                                          |
| `pnpm lint`               | `pnpm --filter=server-admin --filter=server-user run lint && pnpm --filter=auth-node run lint && pnpm --filter @kinal/client-admin run lint && pnpm --filter @kinal/client-admin-next run lint` | Ejecuta ESLint en los paquetes backend y web configurados.                                                                                                                        |
| `pnpm format`             | `pnpm --filter=server-admin --filter=server-user run format \|\| true`                                                                                                                          | Formatea el código de `server-admin` y `server-user` con Prettier.                                                                                                                |
| `pnpm commit`             | `cz`                                                                                                                                                                                            | Inicia el asistente interactivo de Commitizen (`cz-conventional-changelog`).                                                                                                      |
| `pnpm docker:up`          | `docker compose --env-file .env.docker up --build -V`                                                                                                                                           | Construye y levanta el entorno de desarrollo en primer plano recreando volúmenes anónimos (`-V`).                                                                                 |
| `pnpm docker:up:detached` | `docker compose --env-file .env.docker up --build -V -d`                                                                                                                                        | Construye y levanta el entorno de desarrollo en segundo plano (`-d`).                                                                                                             |
| `pnpm docker:down`        | `docker compose --env-file .env.docker down`                                                                                                                                                    | Detiene y elimina los contenedores del entorno de desarrollo.                                                                                                                     |
| `pnpm docker:logs`        | `docker compose --env-file .env.docker logs -f`                                                                                                                                                 | Muestra las bitácoras en tiempo real del entorno de desarrollo.                                                                                                                   |
| `pnpm docker:prod:up`     | `docker compose -f docker-compose.prod.yml --env-file .env.docker up --build -d`                                                                                                                | Construye y levanta el entorno de producción (100% Node.js) en segundo plano.                                                                                                     |
| `pnpm docker:prod:down`   | `docker compose -f docker-compose.prod.yml --env-file .env.docker down`                                                                                                                         | Detiene el entorno de producción.                                                                                                                                                 |
| `pnpm docker:prod:logs`   | `docker compose -f docker-compose.prod.yml --env-file .env.docker logs -f`                                                                                                                      | Muestra las bitácoras del entorno de producción.                                                                                                                                  |
| `pnpm db:seed`            | `node scripts/seed/seed.mjs`                                                                                                                                                                    | Inserta los usuarios, canchas, equipos, torneos y reservaciones iniciales en los contenedores en ejecución.                                                                       |
| `pnpm db:reset`           | `node scripts/seed/seed.mjs --reset`                                                                                                                                                            | Limpia las tablas `users` y `refresh_tokens` en PostgreSQL y las colecciones de MongoDB, reinicia el servicio de autenticación para recrear `admin` y vuelve a sembrar los datos. |
| `pnpm contract:up`        | `docker compose -f docker-compose.yml -f tests/contract/compose.contract.yml --env-file .env.docker up --build -V -d`                                                                           | Levanta el stack de desarrollo junto con Mailpit para las pruebas de contrato HTTP.                                                                                               |
| `pnpm test:contract`      | `pnpm --filter @kinal/contract-tests test`                                                                                                                                                      | Ejecuta la suite de pruebas de contrato HTTP contra los contenedores activos.                                                                                                     |

---

## 3. Sembrado y Reinicio de Datos

El script `scripts/seed/seed.mjs` interactúa mediante `docker exec` con los contenedores `pg-kinal-sports`, `kinal_mongodb`, `kinal_server_admin` y `kinal_auth_service` (o `kinal_auth_node` si `kinal_auth_service` no está en ejecución):

1. **Cargar datos iniciales sin borrar registros existentes (operación idempotente):**
   ```bash
   pnpm db:seed
   ```
2. **Reiniciar por completo las bases de datos a su estado limpio inicial:**
   ```bash
   pnpm db:reset
   ```
   > **Advertencia:** `pnpm db:reset` ejecuta `TRUNCATE users, refresh_tokens CASCADE` en PostgreSQL y `deleteMany({})` sobre las colecciones de MongoDB dentro de los contenedores locales. Úsalo únicamente cuando necesites restablecer tus datos de prueba locales o antes de correr `pnpm test:contract`.

---

## 4. Despliegue en Entorno de Producción

Para ejecutar el monorepo en modo producción (`docker-compose.prod.yml`, con etapas `runtime` compiladas y sin runtime de `.NET`):

1. **Crear el archivo `.env.docker` a partir de la plantilla** y completar los secretos:
   ```bash
   cp .env.docker.example .env.docker
   ```
   Obligatorios: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` (≥ 32 caracteres) e `INTERNAL_SERVICE_TOKEN`.
   Notas relevantes:
   - `SECURE_COOKIES=false` permite login en `http://localhost` al probar el compose de producción. En un despliegue real detrás de **HTTPS** usa `SECURE_COOKIES=true` (también necesario para instalar la PWA de `client-admin` fuera de localhost).
   - `VITE_AUTH_URL` / `VITE_ADMIN_URL` son las URLs que el **navegador** usa hacia los backends (se incrustan en el build de la SPA).
   - `AUTH_API_URL` / `ADMIN_API_URL` son las URLs **internas** de Docker que usa el BFF de `client-admin-next`.
2. **Detener el stack de desarrollo** (comparten los mismos `container_name`):
   ```bash
   pnpm docker:down
   ```
3. **Construir e iniciar los contenedores de producción:**
   ```bash
   pnpm docker:prod:up
   ```
4. **Verificar el estado de los contenedores y la PWA:**
   ```bash
   docker ps
   pnpm docker:prod:logs
   ```
   - Panel SPA + PWA: `http://localhost:5173` (Nginx sirve `sw.js` + `manifest.webmanifest`).
   - Panel Next (BFF): `http://localhost:3000`.
   - Auth (`auth-node`): `http://localhost:3007/api/v1/health`.

---

## 5. Estrategia de Pruebas Automatizadas

### 5.1 Pruebas Unitarias (Rápidas y Aisladas)

- Se ejecutan con `pnpm test` y forman parte del hook `.husky/pre-push`.
- No requieren que PostgreSQL, MongoDB ni Redis estén levantados, ya que utilizan dobles de prueba en memoria (`fakes.ts` en `auth-node`, `NSubstitute` en `auth-service`, mocks de Vitest en `server-admin` / `server-user` / clientes web y Jest en `client-user`).
- Las pruebas de caché (`redis-cache.test.ts`, `RedisCacheServiceTests.cs`, `redis.cache.test.js`) verifican también el comportamiento de degradación en memoria cuando no existe servidor Redis activo.

### 5.2 Pruebas de Contrato HTTP

- Ubicadas en el paquete `tests/contract`, se ejecutan con `pnpm test:contract` tras levantar `pnpm contract:up` y ejecutar `pnpm db:seed`.
- Evalúan en caja negra la paridad entre `auth-node` (`:3007`) y `auth-service` (`:5156`), los flujos administrativos de `server-admin` (`:3009`), las reglas de negocio de `server-user` (`:3008`) y la interoperabilidad cruzada de tokens JWT (`specs/cross-service.test.js`).

---

## 6. Solución de Problemas Frecuentes (_Troubleshooting_)

### 6.1 `docker compose` falla indicando que `.env.docker` no existe o faltan variables

- **Causa:** Los scripts `pnpm docker:*` pasan el argumento `--env-file .env.docker` a Docker Compose. Además, `docker-compose.prod.yml` exige obligatoriamente `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN`.
- **Solución:** En desarrollo basta con crear un archivo vacío (`touch .env.docker`). En producción, define las cuatro variables obligatorias dentro de `.env.docker` (ver [Sección 4](#4-despliegue-en-entorno-de-producción)).

### 6.2 Error de conexión a PostgreSQL al iniciar `auth-service` o `auth-node` localmente

- **Causa:** En el host, el contenedor `pg-kinal-sports` expone PostgreSQL 18 en el puerto **`5435`** (no en el `5432` estándar) para evitar colisiones con instalaciones locales de PostgreSQL.
- **Solución:** Verifica que `DB_PORT=5435` en `authentication-service/auth-node/.env` y `Port=5435;Database=kinal_sports` en `authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json`.

### 6.3 `server-admin` o `server-user` responden `401 Unauthorized` al consultar perfiles internos

- **Causa:** El valor de `INTERNAL_SERVICE_TOKEN` o `JWT_SECRET` no coincide entre los archivos `.env` / `appsettings.Development.json` de los microservicios.
- **Solución:** Asegúrate de que `JWT_SECRET`, `JWT_ISSUER` (`AuthService`), `JWT_AUDIENCE` (`AuthService`) e `INTERNAL_SERVICE_TOKEN` tengan exactamente el mismo valor en `auth-node`, `auth-service`, `server-admin` y `server-user`.

### 6.4 El hook `.husky/pre-commit` detiene el commit por `dotnet format` o `lint-staged`

- **Causa:** Existen advertencias de ESLint (`--max-warnings=0`), archivos sin formatear con Prettier o archivos `.cs` cuyo formato fue corregido automáticamente por `dotnet format`.
- **Solución:**
  1. Revisa los archivos modificados con `git status`.
  2. Si `dotnet format` o Prettier ajustaron el formato, agrega los cambios al área de preparación (`git add .`) y vuelve a ejecutar el commit.
  3. Si ESLint reportó un error o advertencia, corrígelo y comprueba con `pnpm lint`.

### 6.5 `client-user` (React Native / Expo) no logra conectarse a `auth-node` ni a `server-user`

- **Causa:** `localhost` dentro de un emulador Android o de un teléfono físico apunta al propio dispositivo móvil, no a la computadora donde corren los microservicios.
- **Solución:** Ajusta `client-user/.env`:
  - **Emulador Android:** Usa `http://10.0.2.2:3007/api/v1/auth` y `http://10.0.2.2:3008/kinalSportsUser/v1`.
  - **Simulador iOS:** Usa `http://localhost:3007/api/v1/auth` y `http://localhost:3008/kinalSportsUser/v1`.
  - **Dispositivo físico con Expo Go:** Usa la dirección IPv4 LAN de tu equipo (ej. `http://192.168.1.50:3007/api/v1/auth`).

### 6.6 Fallo de envío de correos hacia `mail.lab.kinal.edu.gt` fuera de la red del colegio

- **Causa:** Kinal Mail Hub (`mail.lab.kinal.edu.gt`) opera dentro de la red de laboratorio o requiere una `KMH_PROJECT_API_KEY` válida.
- **Solución:** Para pruebas locales de flujo de verificación y recuperación de contraseña sin acceso a Kinal Mail Hub, levanta el entorno con `pnpm contract:up` (que activa **Mailpit** por SMTP y expone su bandeja web en `http://localhost:8025`) o configura `MAIL_PROVIDER=smtp` apontando a un servidor SMTP de pruebas local.

---

## 7. Documentación Relacionada

- [README Principal del Monorepo](../README.md)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Despliegue institucional (HestiaCP + Docker rootful)](./INSTITUTIONAL_DEPLOYMENT.md)
- [Guía de Colaboración y Contribución](../CONTRIBUTING.md)
- [Pruebas de Contrato HTTP](../tests/contract/README.md)
