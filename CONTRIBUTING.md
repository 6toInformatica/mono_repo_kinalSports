# Guía de Contribución (`CONTRIBUTING.md`)

Esta guía establece los lineamientos técnicos, arquitectónicos y de colaboración para participar en el monorepo **KinalSports**, desarrollado en el contexto formativo y tecnológico de **Fundación Kinal** (Guatemala).

El documento toma como referencias los **GitHub Community Standards**, la especificación **Conventional Commits**, las prácticas de revisión de código en ingeniería de software y lineamientos de integridad académica y uso responsable de inteligencia artificial.

---

## Tabla de Contenidos

1. [Formas de Participación](#1-formas-de-participación)
2. [Requisitos del Entorno](#2-requisitos-del-entorno)
3. [Flujo de Trabajo de Contribución](#3-flujo-de-trabajo-de-contribución)
4. [Convenciones de Ramas y Mensajes de Commit](#4-convenciones-de-ramas-y-mensajes-de-commit)
5. [Validaciones Automáticas (Husky y Commitlint)](#5-validaciones-automáticas-husky-y-commitlint)
6. [Criterios de Calidad Técnica y Arquitectónica](#6-criterios-de-calidad-técnica-y-arquitectónica)
7. [Uso Responsable de Herramientas de Inteligencia Artificial](#7-uso-responsable-de-herramientas-de-inteligencia-artificial)

---

## 1. Formas de Participación

### 1.1 Participación en el contexto educativo (Fundación Kinal)

Los estudiantes y colaboradores que utilizan este repositorio como parte de su formación técnica pueden:

- Analizar la arquitectura e implementación de cada microservicio y cliente como material de estudio.
- Desarrollar prácticas, extensiones funcionales, correcciones de errores y pruebas automatizadas siguiendo el flujo de ramas y revisión por pares (_Code Review_).
- Reportar defectos técnicos o imprecisiones documentales mediante las plantillas de Issues del repositorio.

### 1.2 Contribuciones técnicas y reporte de problemas

- **Reporte de errores (_Bug Reports_):** Utiliza la plantilla `.github/ISSUE_TEMPLATE/bug_report.md` indicando el componente afectado, el entorno (`Docker Dev`, `Docker Prod` o `Local`), los pasos reproducibles y la salida observada.
- **Propuestas de mejora (_Feature Requests_):** Utiliza `.github/ISSUE_TEMPLATE/feature_request.md` detallando el impacto en contratos HTTP, modelos de datos (PostgreSQL / MongoDB) y claves de caché en Redis.
- **Problemas de seguridad:** No publiques vulnerabilidades en Issues abiertos; consulta el procedimiento en [`SECURITY.md`](./SECURITY.md).

---

## 2. Requisitos del Entorno

Verifica contar con las herramientas requeridas por el monorepo antes de iniciar cambios:

- **Node.js:** `>= 22.13.0` (`package.json` `engines.node`)
- **pnpm:** `>= 10` (`packageManager: pnpm@10.29.2`)
- **.NET SDK:** `10.0.x` (requerido para compilar `auth-service` y para el hook `pre-commit` que ejecuta `dotnet format`)
- **Docker y Docker Compose:** Requeridos para levantar la infraestructura y ejecutar las pruebas de contrato (`tests/contract`).

Instalación de dependencias desde la raíz:

```bash
pnpm install
```

---

## 3. Flujo de Trabajo de Contribución

Todo cambio debe seguir estos 7 pasos:

1. **Crear una rama descriptiva** a partir de `master` actualizado:
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feat/server-user-filtro-canchas
   ```
2. **Implementar los cambios** respetando la arquitectura interna del servicio correspondiente (Hexagonal en `auth-node`, Clean Architecture en `auth-service`, Modular en `server-admin`, Por Capas en `server-user`, Features en `client-admin` / `client-user` y BFF en `client-admin-next`).
3. **Ejecutar las pruebas y verificaciones estáticas:**
   ```bash
   pnpm lint
   pnpm test
   pnpm -r --if-present build
   ```
   Si el cambio modifica rutas HTTP, códigos de respuesta o esquemas JSON de algún backend, ejecuta también las pruebas de contrato:
   ```bash
   pnpm contract:up
   pnpm db:seed
   pnpm test:contract
   ```
4. **Documentar las modificaciones:** Si agregas o modificas endpoints, variables de entorno o scripts, actualiza el `.env.example` y el `README.md` del servicio afectado.
5. **Crear un Pull Request (PR)** hacia `master` completando la plantilla `.github/PULL_REQUEST_TEMPLATE.md`.
6. **Participar en la revisión técnica:** Atender las observaciones de arquitectura, seguridad, pruebas o legibilidad planteadas durante el _Code Review_.
7. **Integrar los cambios aprobados** una vez superadas las revisiones y verificaciones.

---

## 4. Convenciones de Ramas y Mensajes de Commit

### 4.1 Nomenclatura de ramas

Utiliza prefijos que identifiquen la naturaleza del trabajo:

- `feat/<scope>-<descripcion>` — Nueva funcionalidad.
- `fix/<scope>-<descripcion>` — Corrección de un defecto.
- `docs/<scope>-<descripcion>` — Creación o mejora de documentación.
- `refactor/<scope>-<descripcion>` — Reestructuración interna sin alterar el comportamiento externo.
- `test/<scope>-<descripcion>` — Adición o ajuste de pruebas unitarias o de contrato.
- `chore/<scope>-<descripcion>` — Tareas de mantenimiento o configuración.

### 4.2 Mensajes de commit (Conventional Commits)

El repositorio valida automáticamente el formato de los mensajes de commit mediante **Commitlint** (`commitlint.config.cjs`, basado en `@commitlint/config-conventional`).

**Estructura obligatoria:**

```text
<tipo>(<scope opcional>): <descripción en minúsculas o sentence-case sin punto final>
```

- **Tipos permitidos:** `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`, `style`, `revert`.
- **Reglas verificadas por `commitlint.config.cjs`:**
  - `subject-case`: únicamente `lower-case` o `sentence-case` (sin punto final).
  - `body-max-line-length`: máximo `120` caracteres por línea en el cuerpo del mensaje.
- **Scopes recomendados del monorepo:** `auth-node`, `auth-service`, `server-admin`, `server-user`, `client-admin`, `client-admin-next`, `client-user`, `contract-tests`, `docker`, `seed`, `docs`.

**Ejemplos válidos:**

```bash
git commit -m "feat(server-admin): agregar filtro por tipo de superficie en canchas"
git commit -m "fix(auth-node): invalidar cache de perfil al verificar correo"
git commit -m "docs(auth-service): actualizar guia de recreacion a net10.0"
```

También puedes utilizar el asistente interactivo configurado en la raíz:

```bash
pnpm commit
```

---

## 5. Validaciones Automáticas (Husky y Commitlint)

El repositorio tiene configurados tres hooks de Git en `.husky/`:

1. **`.husky/pre-commit`:**
   - Ejecuta `pnpm lint-staged`: aplica **Prettier** (`--write`) sobre archivos modificados y **ESLint** (`--fix --max-warnings=0`) sobre archivos `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`.
   - Ejecuta `dotnet format authentication-service/auth-service/AuthService.sln` para garantizar que el código C# cumpla `.editorconfig` (indentación y saltos de línea `LF`).
2. **`.husky/commit-msg`:**
   - Ejecuta `pnpm exec commitlint --edit "$1"` para validar el mensaje de commit.
3. **`.husky/pre-push`:**
   - Ejecuta `pnpm test` (todas las suites unitarias de Node.js y .NET 10) antes de permitir el envío de cambios al remoto.

---

## 6. Criterios de Calidad Técnica y Arquitectónica

Toda contribución será revisada bajo los siguientes criterios verificables:

1. **Seguridad de sesiones y credenciales:**
   - En aplicaciones web (`client-admin` y `client-admin-next`), está prohibido almacenar tokens JWT o _refresh tokens_ en `localStorage` o `sessionStorage`; deben mantenerse en cookies `httpOnly`.
   - En la aplicación móvil (`client-user`), los tokens deben almacenarse exclusivamente en `expo-secure-store`.
   - Ningún commit puede incluir archivos `.env`, `.env.docker`, claves de API ni secretos reales.
2. **Compatibilidad entre servicios de autenticación:**
   - `auth-node` y `auth-service` comparten esquema en PostgreSQL 18 y contrato HTTP. Cualquier cambio en rutas, claims del JWT o estructura de respuesta debe mantener la interoperabilidad entre ambos servicios.
3. **Coherencia de caché en Redis:**
   - Las mutaciones sobre canchas (`fields`) deben invalidar el prefijo `kinal:fields:`.
   - Las mutaciones sobre perfil, fotografía, verificación de correo o rol de usuario deben invalidar `kinal:user:profile:<userId>`.
4. **Pruebas y mantenibilidad:**
   - Las nuevas funcionalidades o correcciones de errores deben acompañarse de sus pruebas unitarias correspondientes sin degradar las existentes.

---

## 7. Uso Responsable de Herramientas de Inteligencia Artificial

En el contexto formativo y de ingeniería de software de **KinalSports**, el uso de asistentes de IA para desarrollo, consulta o redacción debe regirse por los siguientes principios:

1. **Comprensión obligatoria de la solución:** El autor de un commit o Pull Request debe comprender íntegramente el funcionamiento, las implicaciones arquitectónicas y el flujo de ejecución del código que entrega. No se debe enviar código generado automáticamente que el autor no pueda explicar ni depurar.
2. **Responsabilidad del autor:** La responsabilidad técnica sobre la exactitud, calidad, seguridad y mantenibilidad del cambio recae siempre en la persona que firma el commit o abre el Pull Request, independientemente de las herramientas de apoyo utilizadas.
3. **Verificación empírica:** Todo fragmento sugerido por una herramienta de IA debe contrastarse contra el código real del monorepo y validarse ejecutando los linters (`pnpm lint`), compilaciones (`build`) y pruebas automatizadas (`pnpm test`).
4. **Protección de información confidencial:** Nunca ingreses en herramientas externas de IA credenciales reales, tokens internos (`INTERNAL_SERVICE_TOKEN`, `JWT_SECRET`), llaves de API (`KMH_PROJECT_API_KEY`, `CLOUDINARY_API_SECRET`), cadenas de conexión productivas ni datos personales.
5. **Respeto a licencias y derechos de autor:** Verifica que el código incorporado no reproduzca fragmentos con licencias incompatibles ni vulnere la autoría de terceros.
6. **Transparencia:** Cuando una contribución haya contado con asistencia significativa de herramientas generativas, decláralo de forma transparente en la descripción del Pull Request o en los metadatos del commit (`Co-authored-by`).
