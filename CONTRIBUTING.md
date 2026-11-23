# Guía de Contribución (`CONTRIBUTING.md`)

¡Gracias por tu interés en contribuir a **KinalSports**! Este repositorio funciona tanto como un **ecosistema listo para producción** como una **plataforma educativa de referencia** para el ciclo de Sexto Perito en Informática de **Kinal Guatemala**.

Esta guía define los estándares técnicos, arquitectónicos y de flujo de trabajo que mantienen la calidad y consistencia entre todos los microservicios y clientes del monorepo.

---

## Tabla de Contenidos

1. [Requisitos del Entorno de Desarrollo](#1-requisitos-del-entorno-de-desarrollo)
2. [Estructura de Paquetes y Scopes](#2-estructura-de-paquetes-y-scopes)
3. [Flujo de Trabajo con Git y Ramas](#3-flujo-de-trabajo-con-git-y-ramas)
4. [Convención de Commits (Conventional Commits)](#4-convención-de-commits-conventional-commits)
5. [Hooks Automáticos de Calidad (Husky)](#5-hooks-automáticos-de-calidad-husky)
6. [Reglas de Arquitectura y Seguridad al Contribuir](#6-reglas-de-arquitectura-y-seguridad-al-contribuir)
7. [Ejecución de Pruebas (Unitarias y de Contrato)](#7-ejecución-de-pruebas-unitarias-y-de-contrato)
8. [Proceso de Pull Request (PR)](#8-proceso-de-pull-request-pr)

---

## 1. Requisitos del Entorno de Desarrollo

Antes de abrir una rama o enviar cambios, asegúrate de contar con las versiones requeridas:

| Herramienta          | Versión Requerida | Uso                                                                                                                 |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Node.js**          | `>= 22.13.0`      | Runtimes de `auth-node`, `server-admin`, `server-user`, `client-admin`, `client-admin-next` y `client-user`         |
| **pnpm**             | `>= 10.x`         | Gestor de paquetes y workspaces del monorepo (`pnpm@10.29.2`)                                                       |
| **.NET SDK**         | `10.0.x`          | Compilación, formato (`dotnet format`) y pruebas de `auth-service` (`global.json` con `rollForward: latestFeature`) |
| **Docker & Compose** | `v2+`             | Levantar PostgreSQL 18, MongoDB 7, Redis 7 y ejecutar pruebas de contrato                                           |

Instalación inicial en la raíz del monorepo:

```bash
pnpm install
```

---

## 2. Estructura de Paquetes y Scopes

Cada carpeta del monorepo corresponde a un **scope** oficial para tus commits y filtros de `pnpm`:

| Scope de Commit     | Ruta en el Monorepo                   | Filtro `pnpm --filter`     | Descripción                                             |
| ------------------- | ------------------------------------- | -------------------------- | ------------------------------------------------------- |
| `auth-node`         | `authentication-service/auth-node`    | `auth-node`                | Servicio de autenticación en Node.js + Fastify + Prisma |
| `auth-service`      | `authentication-service/auth-service` | `auth-service`             | Servicio de autenticación en .NET 10 + EF Core          |
| `server-admin`      | `server-admin`                        | `server-admin`             | API administrativa en NestJS + Mongoose                 |
| `server-user`       | `server-user`                         | `server-user`              | API de jugadores/reservas en Express + Mongoose         |
| `client-admin`      | `client-admin`                        | `@kinal/client-admin`      | Panel web administrativo en React 19 + Vite             |
| `client-admin-next` | `client-admin-next`                   | `@kinal/client-admin-next` | Panel web administrativo BFF en Next.js 16              |
| `client-user`       | `client-user`                         | `client-user`              | App móvil en React Native + Expo 54                     |
| `contract-tests`    | `tests/contract`                      | `@kinal/contract-tests`    | Suite de pruebas de contrato HTTP de caja negra         |
| `docker`            | `dockerfiles/`, `docker-compose*.yml` | —                          | Orquestación de contenedores e imágenes                 |
| `docs`              | `README.md`, `CONTRIBUTING.md`, etc.  | —                          | Documentación técnica y guías                           |

---

## 3. Flujo de Trabajo con Git y Ramas

1. **Sincroniza tu rama principal (`master`):**
   ```bash
   git checkout master
   git pull origin master
   ```
2. **Crea una rama descriptiva según el tipo de cambio:**
   - `feat/<scope>-<descripcion-corta>` — Nueva funcionalidad (ej. `feat/server-user-bracket-view`)
   - `fix/<scope>-<descripcion-corta>` — Corrección de bug (ej. `fix/auth-node-refresh-cookie`)
   - `refactor/<scope>-<descripcion-corta>` — Mejora interna sin cambiar el contrato HTTP
   - `test/<scope>-<descripcion-corta>` — Nuevas pruebas unitarias o de contrato
   - `docs/<scope>-<descripcion-corta>` — Mejoras en documentación
3. **Realiza commits atómicos y enfocados.**

---

## 4. Convención de Commits (Conventional Commits)

El repositorio valida todos los mensajes de commit mediante **Commitlint** (`.husky/commit-msg` y `commitlint.config.cjs`).

### Formato obligatorio

```text
<tipo>(<scope opcional>): <descripción breve en minúsculas sin punto final>
```

### Tipos permitidos

- `feat`: Nueva funcionalidad para el usuario o nuevo endpoint.
- `fix`: Corrección de un error o bug de seguridad/lógica.
- `refactor`: Cambio de código que no corrige un bug ni agrega funcionalidad.
- `perf`: Mejora de rendimiento (ej. optimización de consultas o caché Redis).
- `test`: Adición o ajuste de pruebas unitarias o de contrato.
- `docs`: Cambios exclusivos en archivos de documentación (`*.md`).
- `build`: Cambios en Dockerfiles, dependencias, `package.json` o `.csproj`.
- `ci`: Cambios en flujos de integración continua o scripts de verificación.
- `chore`: Tareas de mantenimiento general.
- `style`: Cambios de formato (espacios, comas, Prettier, `dotnet format`).

### Ejemplos válidos

```bash
git commit -m "feat(server-admin): agregar filtro por capacidad en query de canchas"
git commit -m "fix(auth-node): invalidar cache redis al cambiar foto de perfil"
git commit -m "docs(client-admin): documentar flujo de cookies httponly"
```

> **Tip:** Si prefieres un asistente interactivo en terminal para construir el mensaje de commit paso a paso, ejecuta:
>
> ```bash
> pnpm commit
> ```

---

## 5. Hooks Automáticos de Calidad (Husky)

Al ejecutar `git commit` y `git push`, Husky ejecuta validaciones automáticas:

1. **`pre-commit` (`.husky/pre-commit`):**
   - Ejecuta `pnpm lint-staged`:
     - Formatea con **Prettier** todos los archivos modificados (`*.js`, `*.ts`, `*.tsx`, `*.json`, `*.md`, `*.yml`).
     - Ejecuta **ESLint** (`--fix --max-warnings=0`) sobre el código JavaScript/TypeScript.
   - Ejecuta `dotnet format authentication-service/auth-service/AuthService.sln` para asegurar que el código C# cumpla `.editorconfig` (indentación y saltos de línea `LF`).
2. **`commit-msg` (`.husky/commit-msg`):**
   - Verifica que el mensaje cumpla el estándar Conventional Commits.
3. **`pre-push` (`.husky/pre-push`):**
   - Ejecuta `pnpm test` (todas las suites unitarias de Node.js y .NET 10) antes de enviar los cambios al servidor remoto.

---

## 6. Reglas de Arquitectura y Seguridad al Contribuir

Para preservar la integridad pedagógica y de producción del proyecto, todo cambio debe respetar estas 5 reglas:

1. **Prohibido guardar JWT o Refresh Tokens en `localStorage` / `sessionStorage`:**
   - En aplicaciones web (`client-admin` y `client-admin-next`), los tokens viajan únicamente en **cookies `httpOnly`** (`kinal_access` y `kinal_refresh`).
   - En la aplicación móvil (`client-user`), los tokens se almacenan exclusivamente en **`expo-secure-store`**.
2. **Paridad de contrato entre `auth-node` y `auth-service`:**
   - En desarrollo y clase se utiliza `.NET 10` (`auth-service`), pero en producción corre únicamente `Node.js` (`auth-node`).
   - Si agregas o modificas un endpoint público o interno en un servicio de autenticación, **debes mantener el mismo contrato de entrada/salida en el otro** (ruta, método HTTP, cabeceras y estructura JSON).
3. **Invalidación de caché en Redis (`Cache-Aside`):**
   - Si modificas casos de uso que alteren una cancha (`fields`), asegúrate de invalidar el prefijo `kinal:fields:` en Redis.
   - Si modificas casos de uso que alteren el perfil, avatar, verificación o rol de un usuario, asegúrate de invalidar `kinal:user:profile:<userId>`.
4. **Uso del método HTTP `QUERY` para consultas con body:**
   - Cuando diseñes una consulta de lectura segura e idempotente que requiera un payload estructurado en el body (como filtros avanzados o resolución interna de perfiles), utiliza el método HTTP `QUERY` manteniendo compatibilidad con `GET` o `POST` según corresponda.
5. **Documentación sincronizada:**
   - Si agregas una variable de entorno, agrégala en el `.env.example` del servicio correspondiente, en su validador de entorno (`env.ts` / `env.validation.ts` / `configs/app.js`) y en la sección **5. Variables de Entorno** de su `README.md`.

---

## 7. Ejecución de Pruebas (Unitarias y de Contrato)

### Pruebas unitarias (sin Docker)

Corren en memoria usando dobles de prueba (`fakes` / `mocks`) y tardan ~15 segundos en total:

```bash
# Ejecutar todas las suites (Node.js + .NET 10)
pnpm test

# Ejecutar todos los linters
pnpm lint

# Verificar compilación de todos los proyectos
pnpm -r --if-present build
```

### Pruebas de contrato (con Docker)

Si tu cambio toca rutas HTTP, códigos de estado o la forma de las respuestas JSON de algún backend, verifica la suite de contrato:

```bash
pnpm contract:up      # Levanta el stack con Mailpit y límites de rate-limit altos
pnpm db:seed          # Carga datos semilla deterministas
pnpm test:contract    # Compara las respuestas contra los snapshots de contrato
```

---

## 8. Proceso de Pull Request (PR)

1. Asegúrate de que `pnpm lint`, `pnpm test` y `pnpm -r --if-present build` terminen sin errores ni advertencias.
2. Sube tu rama al repositorio remoto:
   ```bash
   git push -u origin <nombre-de-tu-rama>
   ```
3. Abre un Pull Request hacia `master` completando la plantilla `.github/PULL_REQUEST_TEMPLATE.md`.
4. Describe claramente **qué** cambió, **por qué** se hizo y **cómo probarlo** paso a paso.
