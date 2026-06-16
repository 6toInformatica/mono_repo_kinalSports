# Client Admin - Panel Administrativo Web

Frontend web para administradores de la plataforma KinalSports construido con React 19 y Vite.

## Descripcion

Aplicacion web SPA (Single Page Application) que permite a administradores gestionar campos deportivos, confirmar/rechazar reservas, administrar usuarios, torneos y equipos.

Consume:

- **auth-service** (.NET) para autenticacion, registro y gestion de usuarios/roles
- **server-admin** para operaciones de negocio (campos, reservas, equipos, torneos)

## Tech Stack

- **Framework**: React 19.2
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM 7.x
- **UI Components**: Material Tailwind React 2.x
- **Styling**: TailwindCSS 4.x
- **Icons**: Heroicons React 2.x
- **HTTP Client**: Axios 1.x
- **State Management**: Zustand 5.x
- **Formularios**: React Hook Form 7.x
- **Notificaciones**: React Hot Toast 2.x

## Instalacion

```bash
pnpm install
cp .env.example .env
pnpm dev
```

> **pnpm 11:** si `pnpm install` falla con `ERR_PNPM_IGNORED_BUILDS` (esbuild), asegurate de que `pnpm-workspace.yaml` tenga `allowBuilds: esbuild: true`, o ejecuta `pnpm approve-builds esbuild`.

## Variables de Entorno

El proyecto usa variables con prefijo `VITE_`. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

| Variable                   | Requerida | Descripcion                      |
| -------------------------- | --------- | -------------------------------- |
| `VITE_AUTH_URL`            | Si        | URL base de auth-service (.NET)  |
| `VITE_ADMIN_URL`           | Si        | URL base de server-admin         |
| `VITE_CLOUDINARY_BASE_URL` | No        | Base de Cloudinary para imagenes |

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3009/kinalSportsAdmin/v1
VITE_CLOUDINARY_BASE_URL=https://res.cloudinary.com/<tu-cloud-name>/image/upload/
```

El archivo `.env` no debe versionarse.

## Estructura

Organizacion por features:

```
client-admin/
├── public/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── layouts/
│   │   └── router/               # AppRoutes.jsx (router activo)
│   ├── features/
│   │   ├── auth/
│   │   ├── fields/
│   │   ├── reservations/
│   │   ├── teams/
│   │   ├── tournaments/
│   │   └── users/
│   ├── shared/
│   │   ├── api/
│   │   ├── components/
│   │   └── utils/
│   └── styles/
├── .env.example
├── vite.config.js
└── package.json
```

Nota de mantenimiento: existen archivos de router duplicados no usados (`AppRouter.jsx`, `routes/AppRoutes.jsx`). El router activo es `src/app/router/AppRoutes.jsx`.

## Scripts

```bash
pnpm dev       # Desarrollo con HMR (http://localhost:5173)
pnpm build     # Build para produccion -> dist/
pnpm preview   # Vista previa del build
pnpm lint      # ESLint
```

## Paginas y Rutas

Router activo: `src/app/router/AppRoutes.jsx`

### Rutas publicas

| Ruta              | Componente        | Descripcion            |
| ----------------- | ----------------- | ---------------------- |
| `/`               | AuthPage          | Login y registro       |
| `/verify-email`   | VerifyEmailPage   | Verificacion de correo |
| `/reset-password` | ResetPasswordPage | Restablecer contrasena |
| `/unauthorized`   | UnauthorizedPage  | Acceso denegado        |

### Rutas protegidas (`ADMIN_ROLE`)

| Ruta                      | Componente   | Descripcion                  |
| ------------------------- | ------------ | ---------------------------- |
| `/dashboard/fields`       | Fields       | Gestion de campos deportivos |
| `/dashboard/reservations` | Reservations | Reservas                     |
| `/dashboard/teams`        | Teams        | Equipos                      |
| `/dashboard/tournaments`  | Tournaments  | Torneos                      |
| `/dashboard/users`        | Users        | Gestion de usuarios          |

Protegidas por `ProtectedRoute` y `RoleGuard` (solo `ADMIN_ROLE`).

## Autenticacion

1. Login en `LoginForm`
2. POST a `{VITE_AUTH_URL}/auth/login` (auth-service)
3. JWT persistido en Zustand (`authStore`, middleware `persist`)
4. Peticiones a server-admin con `Authorization: Bearer <token>`

```jsx
<ProtectedRoute>
  <RoleGuard allowedRoles={['ADMIN_ROLE']}>
    <DashboardPage />
  </RoleGuard>
</ProtectedRoute>
```

## Servicios API

En `src/shared/api/`:

- **`api.js`** — instancias Axios (`authApi`, `adminApi`) con interceptores
- **`auth.js`** — login, registro, verificacion, usuarios (auth-service)
- **`admin.js`** — campos, reservas, equipos, torneos (server-admin)

## Dependencias con Otros Servicios

| Servicio     | Rol                                        |
| ------------ | ------------------------------------------ |
| auth-service | Autenticacion y gestion de usuarios/roles  |
| server-admin | CRUD de campos, reservas, equipos, torneos |

Ambos deben estar corriendo para funcionalidad completa.

## Build y Deployment

```bash
pnpm build
pnpm preview
```

Configura en el hosting las mismas variables `VITE_*` que en `.env` (Vite las embebe en build time).

## Notas de Desarrollo

- Puerto dev: **5173** (default de Vite; Docker usa el mismo)
- HMR y Fast Refresh activados
- Variables deben prefijarse con `VITE_`
- Assets en `public/` se sirven desde la raiz

## Autor

**Braulio Echeverria**

## Licencia

MIT
