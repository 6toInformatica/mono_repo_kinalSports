# Client Admin Next — Panel Administrativo BFF (Next.js 16)

Panel administrativo web construido con **Next.js 16 (App Router)**, **React 19**, **TypeScript** y **TailwindCSS 4** implementando el patron **BFF (Backend For Frontend)**.

---

## 1. Rol en la Arquitectura

- Ofrece la misma funcionalidad administrativa que `client-admin` (mas una vista general de indicadores del dia en `/dashboard`), pero ejecutando toda la comunicacion con los microservicios desde el **servidor de Next.js**.
- Las URLs internas de los microservicios (`AUTH_API_URL` y `ADMIN_API_URL`) y los tokens JWT **nunca llegan al navegador**: el navegador solo habla con su propio origen (`/api/session` y `/api/backend/...`) mediante cookies `httpOnly`.
- En desarrollo (`docker-compose.yml`) se conecta a `auth-service` (.NET 10) y `server-admin`; en produccion (`docker-compose.prod.yml`) se conecta a `auth-node` y `server-admin` sin modificar el codigo del cliente.

---

## 2. Stack Tecnologico

- **Framework y UI:** Next.js 16.4 (App Router, `output: 'standalone'`), React 19.3, TypeScript 6, TailwindCSS 4
- **Seguridad BFF:** Cookies `httpOnly` (`kinal_access`, `kinal_refresh`, `kinal_user`), middleware `src/proxy.ts`, validacion CSRF de `Origin`
- **Pruebas:** Vitest 5 + Testing Library (`jsdom`)

---

## 3. Estructura del Proyecto

```
client-admin-next/
├── src/
│   ├── proxy.ts                        # Middleware de Next: protege /dashboard, verifica rol en JWT y renueva sesion
│   ├── app/
│   │   ├── page.tsx                    # Login y registro
│   │   ├── verify-email/               # Confirmacion de correo
│   │   ├── reset-password/             # Restablecimiento de contrasena
│   │   ├── unauthorized/               # Vista de acceso denegado
│   │   ├── dashboard/                  # Vistas protegidas: resumen, fields, reservations, teams, tournaments, users
│   │   └── api/
│   │       ├── session/route.ts        # Login (POST), usuario actual (GET) y logout (DELETE)
│   │       └── backend/[service]/[...path]/route.ts # Proxy BFF hacia auth y server-admin (GET/POST/PUT/PATCH/DELETE/QUERY)
│   ├── server/
│   │   ├── config.ts                   # Lectura exclusiva en servidor de AUTH_API_URL y ADMIN_API_URL
│   │   ├── session.ts                  # Escritura/limpieza de cookies httpOnly y verificacion de rol en el JWT
│   │   ├── auth-api.ts                 # Llamadas servidor-a-servidor para login, refresh y logout
│   │   └── origin.ts                   # Verificacion Same-Origin contra CSRF
│   ├── features/                       # Modulos de interfaz por dominio (auth, overview, fields, reservations, teams, tournaments, users)
│   └── shared/                         # Cliente HTTP del navegador (/api/...), formateadores y componentes UI
├── .env.example
├── next.config.ts
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp client-admin-next/.env.example client-admin-next/.env.local
pnpm --filter @kinal/client-admin-next dev
```

### Opcion B: Como paquete individual

```bash
cd client-admin-next
pnpm install
cp .env.example .env.local
pnpm dev
```

---

## 5. Variables de Entorno (`.env.local`)

Copia `.env.example` a `.env.local`:

```env
# Solo existen en el servidor de Next (sin prefijo NEXT_PUBLIC_)
AUTH_API_URL=http://localhost:5156/api/v1
ADMIN_API_URL=http://localhost:3009/kinalSportsAdmin/v1

# Publica para construir URLs de imagenes de Cloudinary en el navegador
NEXT_PUBLIC_CLOUDINARY_BASE_URL=https://res.cloudinary.com/b3xvlule/image/upload/
```

| Variable                          | Alcance            | Descripcion                                                                  |
| :-------------------------------- | :----------------- | :--------------------------------------------------------------------------- |
| `AUTH_API_URL`                    | Solo Servidor      | URL base de `auth-service` (.NET) en desarrollo o `auth-node` en produccion. |
| `ADMIN_API_URL`                   | Solo Servidor      | URL base de `server-admin` (NestJS).                                         |
| `NEXT_PUBLIC_CLOUDINARY_BASE_URL` | Cliente y Servidor | Base de Cloudinary para mostrar imagenes almacenadas como `public_id`.       |

---

## 6. Scripts Disponibles

```bash
pnpm --filter @kinal/client-admin-next dev     # Servidor de desarrollo en http://localhost:3000
pnpm --filter @kinal/client-admin-next build   # Compila el build standalone de produccion
pnpm --filter @kinal/client-admin-next start   # Ejecuta el servidor de produccion
pnpm --filter @kinal/client-admin-next test    # Ejecuta las 38 pruebas unitarias con Vitest
pnpm --filter @kinal/client-admin-next lint    # Ejecuta ESLint
```

---

## 7. Arquitectura de Seguridad BFF y Cookies `httpOnly`

1. **Cero Tokens en `localStorage` ni en el Cliente:**
   - Al iniciar sesion en `POST /api/session`, el servidor de Next verifica que el usuario tenga `ADMIN_ROLE` y guarda `kinal_access`, `kinal_refresh` y `kinal_user` en **cookies `httpOnly`** (`SameSite=Lax`, `Secure` en produccion).
2. **Validacion Cruzada de Rol en `src/proxy.ts`:**
   - Antes de renderizar cualquier ruta bajo `/dashboard`, `proxy.ts` verifica tanto `kinal_user.role === 'ADMIN_ROLE'` como el claim `role` dentro del payload del JWT `kinal_access` (`readAccessTokenRole`). Si el access token vencio pero existe `kinal_refresh`, renueva la sesion en el servidor de forma transparente.
3. **Proxy Transparente (`/api/backend/[service]/[...path]`):**
   - Reenvia peticiones `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `QUERY` inyectando `Authorization: Bearer <kinal_access>` desde el servidor y validando `isSameOrigin` contra ataques CSRF.

---

## 8. Rutas de la Aplicacion

| Ruta                      | Tipo                     | Descripcion                                             |
| :------------------------ | :----------------------- | :------------------------------------------------------ |
| `/`                       | Publica                  | Inicio de sesion, registro y recuperacion de contrasena |
| `/verify-email`           | Publica                  | Verificacion de correo electronico                      |
| `/reset-password`         | Publica                  | Restablecimiento de contrasena                          |
| `/unauthorized`           | Publica                  | Pantalla de acceso no autorizado                        |
| `/dashboard`              | Protegida (`ADMIN_ROLE`) | Vista general con indicadores y resumen operativo       |
| `/dashboard/fields`       | Protegida (`ADMIN_ROLE`) | Gestion de canchas deportivas                           |
| `/dashboard/reservations` | Protegida (`ADMIN_ROLE`) | Gestion de reservaciones                                |
| `/dashboard/teams`        | Protegida (`ADMIN_ROLE`) | Gestion de equipos y miembros                           |
| `/dashboard/tournaments`  | Protegida (`ADMIN_ROLE`) | Gestion de torneos                                      |
| `/dashboard/users`        | Protegida (`ADMIN_ROLE`) | Gestion de usuarios y cambio de roles                   |

---

## 9. Integracion con Otros Servicios

| Servicio                     | Relacion                                                                      |
| :--------------------------- | :---------------------------------------------------------------------------- |
| `auth-service` / `auth-node` | Consumido servidor-a-servidor por `/api/session` y `/api/backend/auth/*`.     |
| `server-admin`               | Consumido servidor-a-servidor por `/api/backend/admin/*`.                     |
| `client-admin`               | Implementacion paralela en React + Vite (SPA directa con cookies `httpOnly`). |
