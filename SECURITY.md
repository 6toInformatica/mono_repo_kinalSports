# Política de Seguridad (`SECURITY.md`)

Este documento define los lineamientos de seguridad de aplicaciones, protección de información sensible y divulgación coordinada de vulnerabilidades (_Coordinated Vulnerability Disclosure_) para el monorepo **KinalSports**, tomando como referencia las buenas prácticas de **OWASP** (_ASVS_ y _API Security_), **NIST** y **GitHub Security Advisories**.

---

## Tabla de Contenidos

1. [Alcance de la Política](#1-alcance-de-la-política)
2. [Componentes y Versiones en Mantenimiento](#2-componentes-y-versiones-en-mantenimiento)
3. [Controles de Seguridad Verificados en el Repositorio](#3-controles-de-seguridad-verificados-en-el-repositorio)
4. [Protección de Información Sensible y Secretos](#4-protección-de-información-sensible-y-secretos)
5. [Reporte Responsable de Vulnerabilidades](#5-reporte-responsable-de-vulnerabilidades)
6. [Proceso de Evaluación y Respuesta](#6-proceso-de-evaluación-y-respuesta)

---

## 1. Alcance de la Política

Esta política abarca cuatro dimensiones dentro del monorepo:

1. **Seguridad del código fuente:** Lógica de autenticación, autorización basada en roles (`ADMIN_ROLE`, `USER_ROLE`), validación de entradas, manejo de sesiones y comunicación entre microservicios.
2. **Seguridad de dependencias:** Paquetes de `npm`/`pnpm` (controlados en `pnpm-workspace.yaml` y lockfiles) y paquetes NuGet de `.NET 10` (`.csproj`).
3. **Seguridad de configuración:** Archivos de entorno (`.env.example`, `appsettings*.json`) y políticas de CORS, Rate Limiting y cabeceras HTTP.
4. **Seguridad de contenedores y despliegue:** Definiciones en `dockerfiles/Dockerfile.*` (ejecución con usuarios sin privilegios en etapa `runtime`), `docker-compose.yml` y `docker-compose.prod.yml`.

---

## 2. Componentes y Versiones en Mantenimiento

Únicamente la rama principal (`master`) recibe actualizaciones y correcciones de seguridad:

| Componente          | Ruta                                  | Versión en Repositorio | Estado                                            |
| :------------------ | :------------------------------------ | :--------------------- | :------------------------------------------------ |
| `auth-node`         | `authentication-service/auth-node`    | `2.0.0`                | En mantenimiento activo (Desarrollo y Producción) |
| `auth-service`      | `authentication-service/auth-service` | `1.0.0` (`net10.0`)    | En mantenimiento activo (Desarrollo y Formación)  |
| `server-admin`      | `server-admin`                        | `2.0.0`                | En mantenimiento activo (Desarrollo y Producción) |
| `server-user`       | `server-user`                         | `1.0.0`                | En mantenimiento activo (Desarrollo y Producción) |
| `client-admin`      | `client-admin`                        | `0.0.0` (`master`)     | En mantenimiento activo (Desarrollo y Producción) |
| `client-admin-next` | `client-admin-next`                   | `0.1.0`                | En mantenimiento activo (Desarrollo y Producción) |
| `client-user`       | `client-user`                         | `1.0.0`                | En mantenimiento activo (Desarrollo)              |

---

## 3. Controles de Seguridad Verificados en el Repositorio

Los siguientes mecanismos se encuentran implementados y verificados en el código actual:

- **Hashing de contraseñas:** `Argon2id` tanto en `auth-node` (`src/infrastructure/security/argon2-hasher.ts`) como en `auth-service` (`PasswordHashService.cs`), con soporte de verificación constante.
- **Gestión de sesión web con cookies `httpOnly`:**
  - En `client-admin` y `client-admin-next`, ningún token JWT ni _refresh token_ se almacena en `localStorage` ni `sessionStorage` para mitigar la exfiltración de credenciales ante ataques XSS.
  - Los servicios de autenticación emiten las cookies `kinal_access` (15 min) y `kinal_refresh` (30 días, acotada a `/api/v1/auth`) con atributos `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- **Almacenamiento seguro en dispositivo móvil:** `client-user` almacena los tokens en `expo-secure-store` (_Keychain_ en iOS y _Keystore_ cifrado en Android).
- **Aislamiento Backend for Frontend (BFF) y defensa CSRF:** `client-admin-next` oculta las URLs de los microservicios en el servidor, valida `isSameOrigin` en peticiones mutantes hacia `/api/*` y contrasta el claim `role` del JWT `kinal_access` contra la sesión en `src/proxy.ts`.
- **Rotación de _refresh tokens_ y detección de reúso:** Los _refresh tokens_ se almacenan en PostgreSQL (`refresh_tokens`) y se rotan en cada uso (`POST /api/v1/auth/refresh`), revocando la sesión al detectar tokens reutilizados o al restablecer la contraseña.
- **Autenticación entre microservicios:** Las consultas internas de perfil (`QUERY` / `POST` en `/api/v1/auth/profile/by-id` y `/by-username`) exigen la cabecera `x-internal-token` validada contra `INTERNAL_SERVICE_TOKEN`.
- **Control de acceso y prevención de IDOR:** Los endpoints administrativos verifican `ADMIN_ROLE`, y la consulta `GET /api/v1/users/:userId/roles` comprueba que el solicitante sea el propio usuario o posea `ADMIN_ROLE`.
- **Validación de entradas e identificadores:** Uso de Zod (`auth-node`, `server-admin`), `FluentValidation` (`auth-service`), `express-validator` (`server-user`) y validación de `ObjectId` de MongoDB (`ObjectIdPipe` en `server-admin` y manejo de `CastError` -> `400 INVALID_ID` en `server-user`).
- **Cabeceras HTTP y límite de tasa (_Rate Limiting_):** Configurados mediante `@fastify/helmet` + `@fastify/rate-limit`, `helmet` + `express-rate-limit` y `NetEscapades.AspNetCore.SecurityHeaders` + `RateLimiter` de ASP.NET Core.

---

## 4. Protección de Información Sensible y Secretos

Está estrictamente prohibido publicar en commits, Issues, Pull Requests, capturas de pantalla o archivos de configuración versionados cualquiera de los siguientes elementos:

- Contraseñas reales de usuarios o de bases de datos (`POSTGRES_PASSWORD`, `DB_PASSWORD`, `SEED_ADMIN_PASSWORD` de entornos productivos).
- Secretos de firma de tokens (`JWT_SECRET`).
- Tokens de comunicación interna entre servicios (`INTERNAL_SERVICE_TOKEN`).
- Llaves de API de servicios externos (`KMH_PROJECT_API_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_PASSWORD`).
- Tokens JWT o _refresh tokens_ activos capturados de sesiones reales.
- Datos personales de estudiantes, docentes o usuarios reales.
- Archivos `.env`, `.env.local`, `.env.docker` o `appsettings.Development.json` (todos deben permanecer excluidos por `.gitignore`).

> **Nota sobre valores por defecto en desarrollo:** Los valores presentes en `docker-compose.yml` y en los archivos `.env.example` son exclusivamente marcadores de posición para pruebas locales en contenedores aislados y **jamás deben reutilizarse en despliegues de producción** (`docker-compose.prod.yml`).

---

## 5. Reporte Responsable de Vulnerabilidades

Si identificas una vulnerabilidad de seguridad en el código, configuración o dependencias de **KinalSports**:

1. **No publiques el hallazgo en un Issue público ni en discusiones abiertas** antes de que haya sido evaluado y corregido.
2. **Canal de reporte en el repositorio:** Utiliza la funcionalidad privada de **GitHub Security Advisories** del repositorio (`https://github.com/6toInformatica/mono_repo_kinalSports/security/advisories/new`) si se encuentra habilitada para tu cuenta.
3. **Canal de contacto institucional:** _(Pendiente de confirmación oficial el buzón de correo institucional o de seguridad designado para recibir reportes externos)._ Mientras se confirma dicho canal, comunícalo de forma privada al responsable técnico del repositorio.
4. **Información recomendada en el reporte:**
   - Componente y ruta afectada.
   - Descripción técnica de la vulnerabilidad y su vector de ataque.
   - Pasos mínimos reproducibles (petición HTTP, configuración o prueba unitaria) sin ejecutar acciones destructivas.
   - Impacto estimado (confidencialidad, integridad o disponibilidad).

---

## 6. Proceso de Evaluación y Respuesta

Los reportes recibidos se gestionan bajo un flujo de divulgación coordinada:

1. **Recepción y registro:** Revisión inicial del reporte para confirmar que contiene la información necesaria para reproducir el hallazgo.
2. **Evaluación técnica:** Determinación de la severidad, componentes afectados (`auth-node`, `auth-service`, `server-admin`, `server-user`, clientes o infraestructura) y alcance en desarrollo o producción.
3. **Remediación y verificación:** Desarrollo del parche correspondiente junto con pruebas unitarias o de contrato que prevengan regresiones, o actualización de dependencias en los lockfiles.
4. **Publicación de la corrección:** Integración en la rama `master` y actualización de las notas o avisos de seguridad cuando corresponda.

_(Nota: Al tratarse de un repositorio con fines técnicos y formativos, no se establecen acuerdos de nivel de servicio [SLA] ni tiempos garantizados de respuesta sin confirmación institucional previa)._
