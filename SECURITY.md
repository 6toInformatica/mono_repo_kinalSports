# Política de Seguridad (`SECURITY.md`)

**KinalSports · Fundación Kinal · Sexto Perito en Computación**

Este documento establece la política de seguridad de aplicaciones, los controles implementados en la arquitectura y el procedimiento de divulgación coordinada de vulnerabilidades (_Coordinated Vulnerability Disclosure_) para el monorepo **KinalSports**.

Su estructura y controles toman como referencia los marcos técnicos de **OWASP API Security Top 10**, **OWASP Application Security Verification Standard (ASVS)**, **OWASP Cheat Sheet Series**, **NIST SP 800-53 / SSDF** y las guías de **Coordinated Vulnerability Disclosure (CVD)**.

---

## Índice de Navegación

1. [Alcance de Seguridad y Componentes en Mantenimiento](#1-alcance-de-seguridad-y-componentes-en-mantenimiento)
2. [Arquitectura de Autenticación y Gestión de Sesiones](#2-arquitectura-de-autenticación-y-gestión-de-sesiones)
3. [Autorización y Control de Acceso](#3-autorización-y-control-de-acceso)
4. [Seguridad de APIs y Comunicación Interna](#4-seguridad-de-apis-y-comunicación-interna)
5. [Seguridad de Infraestructura, Contenedores y Dependencias](#5-seguridad-de-infraestructura-contenedores-y-dependencias)
6. [Protección de Secretos y Datos Personales](#6-protección-de-secretos-y-datos-personales)
7. [Uso Responsable de Pruebas de Seguridad](#7-uso-responsable-de-pruebas-de-seguridad)
8. [Reporte de Vulnerabilidades y Divulgación Coordinada](#8-reporte-de-vulnerabilidades-y-divulgación-coordinada)

---

## 1. Alcance de Seguridad y Componentes en Mantenimiento

Las actualizaciones y correcciones de seguridad se aplican sobre la rama principal **`master`** para los siguientes componentes del monorepo:

| Componente          | Ruta en el Monorepo                   | Versión Declarada   | Entorno de Ejecución                         |
| :------------------ | :------------------------------------ | :------------------ | :------------------------------------------- |
| `auth-node`         | `authentication-service/auth-node`    | `2.0.0`             | Desarrollo y Producción (`:3007`)            |
| `auth-service`      | `authentication-service/auth-service` | `1.0.0` (`net10.0`) | Desarrollo y Formación (`:5156`)             |
| `server-admin`      | `server-admin`                        | `2.0.0`             | Desarrollo y Producción (`:3009`)            |
| `server-user`       | `server-user`                         | `1.0.0`             | Desarrollo y Producción (`:3008`)            |
| `client-admin`      | `client-admin`                        | `0.0.0` (`master`)  | Desarrollo y Producción (`:5173` / `:8080`)  |
| `client-admin-next` | `client-admin-next`                   | `0.1.0`             | Desarrollo y Producción (`:3000`)            |
| `client-user`       | `client-user`                         | `1.0.0`             | Desarrollo Móvil (`:8081`)                   |
| Infraestructura     | `dockerfiles/`, `docker-compose*.yml` | Vigente en `master` | Desarrollo, Producción y Pruebas de Contrato |

---

## 2. Arquitectura de Autenticación y Gestión de Sesiones

Conforme a las recomendaciones de **OWASP Authentication Cheat Sheet** y **OWASP Session Management Cheat Sheet**, el monorepo aplica los siguientes controles verificados en el código fuente:

- **Hashing criptográfico de contraseñas (`Argon2id`):**
  - Implementado tanto en `auth-node` (`src/infrastructure/security/argon2-hasher.ts`) como en `auth-service` (`src/AuthService.Infrastructure/Security/PasswordHashService.cs`, con `MemorySize = 102400 KB`, `Iterations = 2`, `DegreeOfParallelism = 8`) y comparación en tiempo constante.
- **Emisión y validación de tokens JWT (`HS256`):**
  - Los tokens de acceso tienen una vigencia corta (`15 minutos`) y validan estrictamente `Issuer` (`AuthService`), `Audience` (`AuthService`), firma `HS256` y expiración sin margen de tolerancia (`ClockSkew = TimeSpan.Zero` en `.NET 10`).
- **Rotación de _refresh tokens_ y detección de reúso:**
  - Los _refresh tokens_ (vigencia de `30 días`) se persisten en la tabla `refresh_tokens` de PostgreSQL 18.
  - En cada llamada a `POST /api/v1/auth/refresh`, el token utilizado se marca como revocado (`revoked_at`, `replaced_by_token`) y se emite uno nuevo. Si se detecta la reutilización de un _refresh token_ previamente revocado o se restablece la contraseña del usuario, se revocan las sesiones asociadas.
- **Almacenamiento seguro de sesión según plataforma:**
  - **Clientes web (`client-admin` y `client-admin-next`):** Ningún token JWT ni _refresh token_ se almacena en `localStorage` ni `sessionStorage` para prevenir la exfiltración de credenciales ante vectores XSS. Los servicios de autenticación emiten las cookies `httpOnly` `kinal_access` y `kinal_refresh` con `SameSite=Lax` y el atributo `Secure` habilitado en producción (`NODE_ENV=production` / `IsProduction()`).
  - **Cliente móvil (`client-user`):** Utiliza el almacenamiento nativo cifrado del sistema operativo móvil a través de `expo-secure-store` (_Keychain_ en iOS y _Keystore_ en Android).
- **Verificación de JWT en el patrón Backend for Frontend (`client-admin-next`):**
  - El servidor Next.js actúa como proxy inverso autenticado (`/api/session` y `/api/backend/...`) manteniendo ocultas las URLs de los microservicios.
  - El middleware `src/proxy.ts` y `src/server/session.ts` (`readAccessTokenRole`) decodifican el payload del token para verificar la consistencia del rol durante la navegación, mientras que la **verificación criptográfica de la firma `HS256` del JWT es ejecutada siempre por los microservicios backend** (`auth-service`, `auth-node` y `server-admin`).

---

## 3. Autorización y Control de Acceso

Siguiendo **OWASP API1:2023 (Broken Object Level Authorization — BOLA/IDOR)** y **API5:2023 (Broken Function Level Authorization)**:

- **Control de acceso basado en roles (`RBAC`):** Separación explícita entre `ADMIN_ROLE` y `USER_ROLE` verificada en `RolesGuard` (`server-admin`), hooks de autorización (`auth-node`) y políticas/controladores (`auth-service`).
- **Prevención de IDOR en roles y recursos de usuario:**
  - En `GET /api/v1/users/:userId/roles`, tanto `auth-node` como `auth-service` verifican que el solicitante sea el titular de `:userId` o posea `ADMIN_ROLE`.
  - En `server-user`, las operaciones de cancelación de reservas y administración de equipos verifican que el usuario autenticado sea el propietario de la reserva o el capitán (`managerId`) del equipo.
- **Protección del último administrador:** La lógica de cambio de rol impide degradar al último usuario con `ADMIN_ROLE` en el sistema.
- **Invalidación inmediata de caché tras cambios de privilegio:** Cuando se modifica el rol de un usuario (`PUT /api/v1/users/:userId/role`), el servicio invalida de inmediato la clave `kinal:user:profile:<userId>` en Redis 7.

---

## 4. Seguridad de APIs y Comunicación Interna

En línea con **OWASP API Security Top 10** y **OWASP Input Validation / CSRF Cheat Sheets**:

- **Autenticación servicio-a-servicio (`x-internal-token`):**
  - Los endpoints internos de resolución de perfiles (`QUERY` y `POST` en `/api/v1/auth/profile/by-id` y `/api/v1/auth/profile/by-username`) están restringidos mediante el hook `requireInternalToken` (`auth-node`) y el filtro `[InternalServiceToken]` (`auth-service`), que comparan la cabecera `x-internal-token` utilizando `CryptographicOperations.FixedTimeEquals` / comparación segura contra `INTERNAL_SERVICE_TOKEN`.
- **Consultas filtradas mediante el método HTTP `QUERY`:**
  - Las consultas internas de perfiles (que incluyen `userId` o `username`) y los filtros complejos de canchas utilizan el verbo HTTP `QUERY` con payload JSON en el cuerpo de la petición para evitar exponer parámetros sensibles en URLs, historiales o bitácoras de acceso.
- **Defensa CSRF en el BFF (`isSameOrigin`):**
  - En `client-admin-next/src/server/origin.ts`, todas las peticiones mutantes (`POST`, `PUT`, `PATCH`, `DELETE`) dirigidas a `/api/*` verifican que las cabeceras `Origin` o `Referer` coincidan exactamente con el origen del servidor antes de procesar o reenviar la solicitud.
- **Validación estricta de esquemas e identificadores:**
  - Validación de payloads y variables de entorno mediante **Zod 4** (`auth-node`, `server-admin`), **FluentValidation 12** (`auth-service`) y **express-validator 7** (`server-user`).
  - Validación de identificadores de MongoDB (`ObjectIdPipe` en `server-admin` y normalización de `CastError` a `400 INVALID_ID` en `server-user`) y límites de tamaño en cargas `multipart/form-data` (con validación de tipos de imagen permitidos).
- **Cabeceras HTTP de seguridad y _Rate Limiting_:**
  - Aplicación de cabeceras de endurecimiento (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) y limitadores de tasa diferenciados para rutas de autenticación y rutas de API mediante `@fastify/helmet` + `@fastify/rate-limit`, `helmet` + `express-rate-limit` y `NetEscapades.AspNetCore.SecurityHeaders` + `RateLimiter` de ASP.NET Core.

---

## 5. Seguridad de Infraestructura, Contenedores y Dependencias

- **Ejecución sin privilegios en contenedores (`runtime`):**
  - En `dockerfiles/Dockerfile.*`, las etapas de producción (`target: runtime`) se ejecutan bajo usuarios sin privilegios de `root`: `USER node` en los servicios Node.js, `USER $APP_UID` en `auth-service` (`.NET 10`) y `nginxinc/nginx-unprivileged:1.27-alpine` (puerto `8080`) en `client-admin`.
- **Fallo seguro ante ausencia de secretos en producción:**
  - El archivo `docker-compose.prod.yml` exige explícitamente la definición de `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` e `INTERNAL_SERVICE_TOKEN` mediante la sintaxis `${VARIABLE:?Define ... en .env.docker}`, impidiendo levantar el entorno productivo con contraseñas por defecto.
- **Gestión de vulnerabilidades en dependencias (`pnpm` y `NuGet`):**
  - `pnpm-workspace.yaml` centraliza `overrides` de seguridad para dependencias transitivas (como `minimatch`, `uuid`, `glob`, `effect` y `node-forge`) y restringe qué paquetes tienen permiso de ejecutar scripts de compilación nativa mediante `allowBuilds`.
  - En `.NET 10`, `AuthService.Infrastructure.csproj` fija explícitamente versiones parchadas de paquetes transitivos sensibles (como `System.Security.Cryptography.Pkcs` `10.0.14`).

---

## 6. Protección de Secretos y Datos Personales

### 6.1 Prohibición de exposición de credenciales

Está estrictamente prohibido incorporar al control de versiones, commits, descripciones de Issues, Pull Requests, capturas de pantalla o herramientas externas de IA cualquiera de los siguientes elementos:

- Archivos `.env`, `.env.local`, `.env.docker` o `appsettings.Development.json`.
- Claves de firma y tokens internos (`JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`).
- Contraseñas de bases de datos o de cuentas reales (`POSTGRES_PASSWORD`, `DB_PASSWORD`, `SEED_ADMIN_PASSWORD` productivos).
- Credenciales de servicios externos (`KMH_PROJECT_API_KEY`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_PASSWORD`).
- Cookies de sesión (`kinal_access`, `kinal_refresh`) o tokens JWT extraídos de entornos activos.

> **Advertencia sobre valores de desarrollo:** Las cadenas presentes en `docker-compose.yml`, `scripts/seed/` y archivos `*.example` son marcadores de posición destinados exclusivamente a contenedores locales aislados de desarrollo y pruebas. **Bajo ninguna circunstancia deben utilizarse en despliegues de producción o servidores expuestos.**

### 6.2 Protección de datos personales

En coherencia con los criterios de privacidad y convivencia adoptados en este proyecto:

- Para las pruebas, demostraciones, capturas de pantalla y semillas de base de datos deben emplearse únicamente **datos ficticios o cuentas de prueba** (como los usuarios `@ksports.local` generados por `pnpm db:seed`).
- No deben almacenarse ni publicarse en el repositorio números de teléfono reales, direcciones personales, fotografías privadas ni correos electrónicos personales de estudiantes o terceros sin autorización.

---

## 7. Uso Responsable de Pruebas de Seguridad

El análisis de seguridad y la verificación de controles dentro del contexto formativo de **Sexto Perito en Computación** deben realizarse con responsabilidad ética:

1. **Entorno autorizado:** Toda prueba de verificación de seguridad, validación de tokens o comprobación de límites de tasa debe ejecutarse exclusivamente sobre la instancia local de contenedores del propio estudiante (`localhost`), nunca contra infraestructura compartida del colegio ni contra entornos de otros compañeros sin autorización expresa.
2. **Prohibición de acciones destructivas:** No se deben ejecutar ataques de denegación de servicio (DoS), fuerza bruta masiva contra servicios externos (como Kinal Mail Hub o Cloudinary) ni alteración no autorizada de datos.
3. **Resguardo de hallazgos:** Si durante una práctica o revisión de código un estudiante o colaborador descubre una vulnerabilidad en el monorepo, debe abstenerse de explotarla o divulgarla públicamente y seguir el procedimiento de reporte coordinado.

---

## 8. Reporte de Vulnerabilidades y Divulgación Coordinada

Este proyecto aplica el principio de **Divulgación Coordinada de Vulnerabilidades (_Coordinated Vulnerability Disclosure_ — CVD)**:

### 8.1 Cómo reportar una vulnerabilidad

1. **No abras un Issue público ni un Pull Request público** que describa un vector de ataque explotable antes de que haya sido evaluado y remediado.
2. **Canal técnico en GitHub:** Si tienes acceso al repositorio remoto, utiliza la función privada de **GitHub Security Advisories** (`https://github.com/6toInformatica/mono_repo_kinalSports/security/advisories/new`).
3. **Comunicación directa:** Notifica el hallazgo de forma privada al responsable técnico del proyecto (**Braulio Echeverría**) o a los administradores del repositorio en el contexto de **Sexto Perito en Computación**.
4. **Canal institucional formal:** _La designación de un buzón de correo institucional específico para reportes externos de seguridad de este repositorio se encuentra pendiente de confirmación oficial._

### 8.2 Contenido recomendado del reporte

Para facilitar el análisis y la corrección, incluye en tu notificación privada:

- **Componente(s) afectado(s)** y ruta exacta del archivo o endpoint.
- **Descripción técnica** de la vulnerabilidad (por ejemplo, validación faltante, control de acceso omitido o dependencia vulnerable).
- **Pasos mínimos reproducibles** (petición HTTP, prueba unitaria o configuración) demostrados en un entorno local aislado.
- **Impacto potencial** sobre confidencialidad, integridad o disponibilidad y, si lo deseas, una propuesta de remediación.

### 8.3 Flujo de tratamiento

1. **Recepción y verificación técnica:** Confirmación de que el reporte es reproducible en la rama `master`.
2. **Diagnóstico y desarrollo de corrección:** Elaboración del parche en el componente afectado junto con su prueba unitaria o de contrato correspondiente para evitar regresiones.
3. **Integración y actualización:** Publicación de la mejora en `master` y actualización de la documentación o de los `overrides` de dependencias cuando corresponda.

> **Nota sobre tiempos de respuesta:** Dado el carácter académico, técnico y formativo del proyecto, los reportes se atienden con diligencia dentro de las actividades de mantenimiento del repositorio, sin establecer acuerdos comerciales de nivel de servicio (SLA) ni plazos fijos no autorizados institucionalmente.
