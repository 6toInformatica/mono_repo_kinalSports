# Política de Seguridad (`SECURITY.md`)

La seguridad es uno de los pilares centrales de **KinalSports**, tanto para su despliegue en producción como para la enseñanza de buenas prácticas de ingeniería de software en el ciclo de Sexto Perito en Informática de **Kinal Guatemala**.

---

## 1. Versiones Soportadas

Actualmente se mantienen con actualizaciones de seguridad las siguientes versiones del monorepo:

| Componente                                  | Versión | Estado de Soporte                   |
| ------------------------------------------- | ------- | ----------------------------------- |
| `auth-node` (Fastify 5 + Node.js 22)        | `2.0.x` | Soportado (Producción y Desarrollo) |
| `auth-service` (.NET 10 ASP.NET Core)       | `1.0.x` | Soportado (Desarrollo y Enseñanza)  |
| `server-admin` (NestJS 11 + Node.js 22)     | `2.0.x` | Soportado (Producción y Desarrollo) |
| `server-user` (Express 5 + Node.js 22)      | `1.0.x` | Soportado (Producción y Desarrollo) |
| `client-admin` (React 19 + Vite)            | `1.0.x` | Soportado (Producción y Desarrollo) |
| `client-admin-next` (Next.js 16 App Router) | `0.1.x` | Soportado (Producción y Desarrollo) |
| `client-user` (React Native + Expo 54)      | `1.0.x` | Soportado (Producción y Desarrollo) |

---

## 2. Controles de Seguridad Implementados en la Arquitectura

### 2.1 Gestión Segura de Sesiones y Tokens JWT

- **Cero `localStorage` para credenciales:** Los paneles web (`client-admin` y `client-admin-next`) **jamás** almacenan el `accessToken` ni el `refreshToken` en `localStorage` o `sessionStorage` para mitigar el robo de sesión ante vulnerabilidades XSS (_Cross-Site Scripting_).
- **Cookies `httpOnly` con alcance restringido:**
  - `kinal_access`: Cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción, vigencia de 15 minutos (`Max-Age=900`).
  - `kinal_refresh`: Cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción, restringida exclusivamente a la ruta `/api/v1/auth` (`Max-Age=30 días`).
- **Almacenamiento cifrado en móvil:** `client-user` guarda los tokens en el llavero criptográfico del sistema operativo mediante **`expo-secure-store`** (_Keychain_ en iOS y _Keystore_ en Android).
- **Verificación de rol en el BFF (`client-admin-next`):** El middleware `src/proxy.ts` valida que el rol de sesión coincida con el claim `role` firmado dentro del JWT `kinal_access` antes de permitir el acceso a `/dashboard/*`.

### 2.2 Autenticación Entre Microservicios (`X-Internal-Token`)

- Los endpoints internos de consulta de perfiles (`QUERY /api/v1/auth/profile/by-id` y `/by-username`) requieren la cabecera `X-Internal-Token` validada contra `INTERNAL_SERVICE_TOKEN` antes de devolver información de usuarios.

### 2.3 Protección de Contraseñas y Datos

- Hashing de contraseñas con **Argon2id / PBKDF2** compatible entre `auth-node` y `auth-service`.
- Validación estricta de identificadores de MongoDB (`ObjectIdPipe` en `server-admin` y `mongoose.isValidObjectId` en `server-user`) para evitar `CastError` no controlados e inyecciones NoSQL.
- Protección contra **IDOR** (_Insecure Direct Object Reference_) en `GET /api/v1/users/:userId/roles`: un usuario autenticado solo puede consultar sus propios roles salvo que posea `ADMIN_ROLE`.

### 2.4 Endurecimiento HTTP

- Cabeceras de seguridad mediante **Helmet** (`@fastify/helmet` y `helmet`) y políticas **CORS** explícitas por lista blanca (`ALLOWED_ORIGINS` / `ADMIN_ALLOWED_ORIGINS`).
- Limitación de tasa de peticiones (**Rate Limiting**) diferenciada para rutas públicas y rutas sensibles de autenticación (`/login`, `/register`, `/forgot-password`, `/reset-password`).

---

## 3. Reglas para el Manejo de Secretos

1. **Nunca subas archivos `.env` ni `.env.docker` al repositorio.** Ambos están excluidos en `.gitignore`.
2. **Credenciales que jamás deben aparecer en el historial de Git:**
   - `JWT_SECRET` reales de producción (deben tener al menos 32 caracteres de alta entropía).
   - `INTERNAL_SERVICE_TOKEN` de producción.
   - `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.
   - `KMH_PROJECT_API_KEY` (API key de Kinal Mail Hub) y `SMTP_PASSWORD`.
   - `POSTGRES_PASSWORD` y cadenas de conexión con credenciales reales.
3. En los archivos `.env.example` utiliza únicamente valores de marcador de posición (`your-api-key`, `your-jwt-secret-of-at-least-32-characters`).

---

## 4. Cómo Reportar una Vulnerabilidad

Si descubres una vulnerabilidad de seguridad en cualquiera de los servicios o clientes de **KinalSports**:

1. **No abras un Issue público** con el exploit o con credenciales expuestas.
2. Envía un reporte privado a través de la pestaña [**Security -> Report a vulnerability**](https://github.com/6toInformatica/mono_repo_kinalSports/security/advisories) del repositorio en GitHub o directamente al catedrático/autor responsable del proyecto (**Braulio Echeverría**).
3. Incluye en tu reporte:
   - Servicio o cliente afectado (`auth-node`, `auth-service`, `server-admin`, `server-user`, `client-admin`, `client-admin-next`, `client-user`).
   - Pasos detallados para reproducir el problema (petición `curl`, payload o flujo en pantalla).
   - Impacto potencial (escalación de privilegios, exposición de datos, denegación de servicio, XSS, CSRF, etc.).
   - Propuesta de mitigación si la tienes.
