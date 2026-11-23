# Client Admin — Panel Administrativo Web (React + Vite)

Aplicacion web SPA (Single Page Application) para administradores de KinalSports construida con **React 19**, **Vite 8**, **TailwindCSS 4** y **Zustand 5**.

---

## 1. Rol en la Arquitectura

- Permite a los administradores (`ADMIN_ROLE`) gestionar **canchas deportivas**, **confirmar o cancelar reservaciones**, **administrar equipos**, **torneos** y **roles de usuarios**.
- En desarrollo (`docker-compose.yml`) consume `auth-service` (.NET 10) y `server-admin` (NestJS).
- En produccion (`docker-compose.prod.yml`) consume `auth-node` (Node.js) y `server-admin` (NestJS) y se sirve como bundle estatico optimizado mediante **Nginx sin privilegios**.

---

## 2. Stack Tecnologico

- **UI y Bundler:** React 19.3, Vite 8, TailwindCSS 4 (`@tailwindcss/vite`), Heroicons React 2
- **Ruteo y Estado:** React Router DOM 7, Zustand 5 (persistencia selectiva con `partialize`)
- **Formularios y Alertas:** React Hook Form 7, React Hot Toast 2
- **Cliente HTTP y Pruebas:** Axios 1 (`withCredentials: true`), Vitest 5 + Testing Library

---

## 3. Estructura del Proyecto

```
client-admin/
├── public/
├── src/
│   ├── app/
│   │   ├── main.jsx                    # Punto de entrada React
│   │   ├── App.jsx                     # Proveedores globales y Toaster
│   │   ├── layouts/                    # Layout del dashboard con navegacion lateral
│   │   └── router/
│   │       └── AppRoutes.jsx           # Definicion de rutas publicas y protegidas (ADMIN_ROLE)
│   ├── features/
│   │   ├── auth/                       # Login, registro, verificacion, reset, RoleGuard y authStore
│   │   ├── fields/                     # Listado, creacion, edicion y activacion de canchas
│   │   ├── reservations/               # Gestion y filtro de reservaciones
│   │   ├── teams/                      # Gestion de equipos, capitanes y miembros
│   │   ├── tournaments/                # Gestion de torneos deportivos
│   │   └── users/                      # Listado de usuarios y cambio de rol (ADMIN_ROLE / USER_ROLE)
│   └── shared/
│       ├── api/
│       │   ├── api.js                  # Instancias axiosAuth y axiosAdmin (withCredentials: true)
│       │   ├── auth.js                 # Llamadas a /auth/* y /users/*
│       │   ├── admin.js                # Llamadas a /fields, /reservations, /teams y /tournaments
│       │   └── sessionRefresh.js       # Renovacion automatica de sesion con cookie httpOnly
│       ├── components/                 # Componentes UI reutilizables
│       └── utils/                      # Formateadores de fechas e imagenes de Cloudinary
├── .env.example
├── vite.config.js
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp client-admin/.env.example client-admin/.env
pnpm --filter @kinal/client-admin dev
```

### Opcion B: Como paquete individual

```bash
cd client-admin
pnpm install
cp .env.example .env
pnpm dev
```

---

## 5. Variables de Entorno (`.env`)

Copia `.env.example` a `.env`:

```env
# En desarrollo con .NET (5156) o con auth-node (3007)
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3009/kinalSportsAdmin/v1
VITE_CLOUDINARY_BASE_URL=https://res.cloudinary.com/b3xvlule/image/upload/
```

| Variable                   | Requerida | Descripcion                                                            |
| :------------------------- | :-------- | :--------------------------------------------------------------------- |
| `VITE_AUTH_URL`            | Si        | URL base del servicio de autenticacion (`auth-service` o `auth-node`). |
| `VITE_ADMIN_URL`           | Si        | URL base de `server-admin`.                                            |
| `VITE_CLOUDINARY_BASE_URL` | No        | Prefijo de Cloudinary para resolver `public_id` de imagenes.           |

---

## 6. Scripts Disponibles

```bash
pnpm --filter @kinal/client-admin dev       # Servidor de desarrollo con HMR (http://localhost:5173)
pnpm --filter @kinal/client-admin build     # Compila el bundle de produccion en dist/
pnpm --filter @kinal/client-admin preview   # Sirve localmente el bundle compilado
pnpm --filter @kinal/client-admin test      # Ejecuta las 15 pruebas unitarias con Vitest
pnpm --filter @kinal/client-admin lint      # Ejecuta ESLint
```

---

## 7. Seguridad de Sesion: Cookies `httpOnly` vs `localStorage`

> **Nota pedagogica para clase:** Anteriormente era habitual en SPAs guardar el `accessToken` JWT y el `refreshToken` dentro de `localStorage`. Sin embargo, cualquier vulnerabilidad XSS (Cross-Site Scripting) permitiria a un script malicioso leer `window.localStorage` y robar la sesion del administrador. Por ello, **la practica correcta de seguridad es almacenar los tokens en cookies `httpOnly`**.

1. **Emision (`POST /auth/login`):** `axiosAuth` envia las credenciales con `withCredentials: true`. El backend (`auth-service` o `auth-node`) adjunta las cookies `httpOnly` `kinal_access` (15 min) y `kinal_refresh` (30 dias) con `SameSite=Lax`.
2. **Almacenamiento en el navegador (`authStore.js`):** El middleware `persist` de Zustand usa `partialize` para guardar en `localStorage` **unicamente** metadatos no sensibles de la interfaz (`{ user, isAuthenticated, expiresAt }`), excluyendo por completo `token` y `refreshToken`.
3. **Renovacion transparente (`sessionRefresh.js`):** Cuando `kinal_access` vence y una peticion responde `401` o `403 TOKEN_EXPIRED`, el interceptor llama una sola vez a `POST /auth/refresh` (enviando automaticamente la cookie `kinal_refresh`) y reintenta las peticiones en vuelo.

---

## 8. Rutas de la Aplicacion

### Rutas Publicas

| Ruta              | Vista               | Descripcion                                               |
| :---------------- | :------------------ | :-------------------------------------------------------- |
| `/`               | `AuthPage`          | Inicio de sesion, registro y recuperacion de contrasena   |
| `/verify-email`   | `VerifyEmailPage`   | Confirmacion de cuenta desde el enlace enviado por correo |
| `/reset-password` | `ResetPasswordPage` | Cambio de contrasena con token de recuperacion            |
| `/unauthorized`   | `UnauthorizedPage`  | Aviso de acceso restringido a `ADMIN_ROLE`                |

### Rutas Protegidas (`ProtectedRoute` + `RoleGuard` para `ADMIN_ROLE`)

| Ruta                      | Vista          | Descripcion                                             |
| :------------------------ | :------------- | :------------------------------------------------------ |
| `/dashboard/fields`       | `Fields`       | Creacion, edicion y activacion/desactivacion de canchas |
| `/dashboard/reservations` | `Reservations` | Confirmacion, cancelacion y filtrado de reservaciones   |
| `/dashboard/teams`        | `Teams`        | Administracion de equipos, capitanes y miembros         |
| `/dashboard/tournaments`  | `Tournaments`  | Creacion, edicion y eliminacion de torneos              |
| `/dashboard/users`        | `Users`        | Listado de usuarios y asignacion de roles               |

---

## 9. Integracion con Otros Servicios

| Servicio                     | Relacion                                                                           |
| :--------------------------- | :--------------------------------------------------------------------------------- |
| `auth-service` / `auth-node` | Inicio/cierre de sesion con cookies `httpOnly` y administracion de usuarios/roles. |
| `server-admin`               | Operaciones de negocio sobre canchas, reservaciones, equipos y torneos.            |
| `client-admin-next`          | Implementacion alternativa en Next.js 16 (patron BFF) con la misma funcionalidad.  |
