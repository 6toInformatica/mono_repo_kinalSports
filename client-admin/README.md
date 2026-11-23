# Client Admin — Panel Administrativo Web SPA (React 19 + Vite 8)

## 1. Propósito del Componente

`client-admin` es la aplicación web de tipo _Single Page Application_ (SPA) para la administración de **KinalSports**, construida con **React 19**, **Vite 8**, **TailwindCSS 4** y **Zustand 5**.

Dentro del diseño formativo y arquitectónico del monorepo, permite contrastar una SPA tradicional (que se comunica desde el navegador hacia los microservicios empleando cookies `httpOnly` con `withCredentials: true`) frente a la implementación **Backend for Frontend (BFF)** en Next.js (`client-admin-next`).

---

## 2. Responsabilidad dentro de KinalSports

- Provee la interfaz gráfica para usuarios con rol `ADMIN_ROLE`: gestión de canchas deportivas, confirmación y cancelación de reservaciones, administración de equipos y miembros, control de torneos y administración de roles de usuarios.
- En el entorno de desarrollo (`docker-compose.yml`), consume `auth-service` (`.NET 10`, `:5156`) y `server-admin` (`NestJS`, `:3009`).
- En el entorno de producción (`docker-compose.prod.yml`), consume `auth-node` (`Fastify`, `:3007`) y `server-admin` (`NestJS`, `:3009`), sirviéndose como bundle estático desde un contenedor **Nginx sin privilegios**.

---

## 3. Stack Tecnológico Verificado

| Categoría                        | Paquete / Versión (`package.json`)                                                | Uso en la Aplicación                                                                                       |
| :------------------------------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Librería UI y Bundler**        | `react` `^19.3.1`, `react-dom` `^19.3.1`, `vite` `^8.3.7`                         | Renderizado de componentes y empaquetado con _Hot Module Replacement_ (HMR).                               |
| **Estilos e Iconografía**        | `tailwindcss` `^4.3.5`, `@tailwindcss/vite` `^4.3.5`, `@heroicons/react` `^2.2.0` | Sistema de estilos utilitarios y componentes visuales.                                                     |
| **Enrutamiento y Estado**        | `react-router-dom` `^7.18.5`, `zustand` `^5.0.16`                                 | Rutas públicas/protegidas y estado global de sesión con persistencia selectiva (`partialize`).             |
| **Formularios y Notificaciones** | `react-hook-form` `^7.91.0`, `react-hot-toast` `^2.6.1`                           | Validación de formularios y notificaciones emergentes.                                                     |
| **Cliente HTTP**                 | `axios` `^1.21.1`                                                                 | Instancias `axiosAuth` y `axiosAdmin` con `withCredentials: true` e interceptores de renovación de sesión. |
| **Pruebas Unitarias**            | `vitest` `^5.1.0`, `@testing-library/react` `^16.3.2`, `jsdom` `^29.0.1`          | Pruebas de componentes, formularios de autenticación y renovación automática de sesión.                    |

---

## 4. Arquitectura Interna (Organización por Features)

El código fuente dentro de `src/` sigue una organización modular por dominio funcional (_Feature-Sliced_):

1. **Capa de Aplicación (`src/app/`):**
   - `main.jsx` y `App.jsx`: Inicialización de React y proveedores globales.
   - `router/AppRoutes.jsx`: Define las rutas públicas (`/`, `/verify-email`, `/reset-password`, `/unauthorized`) y las rutas protegidas bajo `/dashboard/*` envueltas en `ProtectedRoute` y `RoleGuard` (`ADMIN_ROLE`).
   - `layouts/`: Estructura de navegación lateral y cabecera del panel administrativo.
2. **Módulos de Dominio (`src/features/`):**
   - `auth/`: Páginas de autenticación, `RoleGuard`, `ProtectedRoute` y `store/authStore.js`.
   - `fields/`: Listado, filtrado, creación, edición y activación/desactivación de canchas con carga de imagen.
   - `reservations/`: Tabla de reservaciones con filtros por estado/cancha y acciones de confirmación o cancelación.
   - `teams/`: Administración de equipos, cambio de capitán y gestión de miembros nombrados.
   - `tournaments/`: Creación, edición, activación y eliminación de torneos.
   - `users/`: Listado de usuarios registrados y cambio de rol (`ADMIN_ROLE` / `USER_ROLE`).
3. **Capa Compartida (`src/shared/`):**
   - `api/api.js`: Configura `axiosAuth` (`VITE_AUTH_URL`, timeout 15 s) y `axiosAdmin` (`VITE_ADMIN_URL`, timeout 15 s) con `withCredentials: true`.
   - `api/sessionRefresh.js`: Coordina la renovación de sesión mediante una única promesa compartida (`refreshPromise`) hacia `POST /auth/refresh` cuando una petición recibe `401` o `403` (`TOKEN_EXPIRED`).

### Seguridad de Sesión en el Navegador

- `authStore.js` utiliza el middleware `persist` de Zustand con la función `partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, expiresAt: state.expiresAt })`.
- **Ningún token JWT (`token`) ni `refreshToken` se guarda en `localStorage`**. La autenticación descansa en las cookies `httpOnly` (`kinal_access` y `kinal_refresh`) gestionadas por el navegador.

---

## 5. Estructura Principal del Directorio

```text
client-admin/
├── public/
├── src/
│   ├── app/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── layouts/
│   │   └── router/AppRoutes.jsx
│   ├── features/
│   │   ├── auth/
│   │   ├── fields/
│   │   ├── reservations/
│   │   ├── teams/
│   │   ├── tournaments/
│   │   └── users/
│   ├── shared/
│   │   ├── api/                        # api.js, auth.js, admin.js, sessionRefresh.js
│   │   ├── components/
│   │   └── utils/
│   └── test/                           # Configuración de entorno Vitest + Testing Library
├── .env.example
├── vite.config.js
└── package.json
```

---

## 6. Requisitos

- **Node.js:** `>= 22.13.0`
- **pnpm:** `>= 10`
- **Backends en ejecución:** `server-admin` (`:3009`) y un servicio de autenticación (`auth-service` en `:5156` o `auth-node` en `:3007`) con el origen de `client-admin` (`http://localhost:5173`) permitido en CORS.

---

## 7. Configuración (`.env`)

Copia `.env.example` a `.env`:

```bash
cp client-admin/.env.example client-admin/.env
```

Variables utilizadas por Vite (`import.meta.env`):

| Variable                   | Requerida | Valor de Referencia (Desarrollo)                    | Descripción                                                                                        |
| :------------------------- | :-------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `VITE_AUTH_URL`            | Sí        | `http://localhost:5156/api/v1`                      | URL base del servicio de autenticación (`http://localhost:3007/api/v1` cuando se usa `auth-node`). |
| `VITE_ADMIN_URL`           | Sí        | `http://localhost:3009/kinalSportsAdmin/v1`         | URL base de `server-admin`.                                                                        |
| `VITE_CLOUDINARY_BASE_URL` | No        | `https://res.cloudinary.com/b3xvlule/image/upload/` | Prefijo público de Cloudinary para construir URLs de imágenes almacenadas como `public_id`.        |

---

## 8. Ejecución Local

### Desde la raíz del monorepo

```bash
pnpm --filter @kinal/client-admin dev
```

### Desde el directorio del paquete

```bash
cd client-admin
pnpm install
pnpm dev
```

### Scripts disponibles en `package.json`

- `pnpm dev`: Inicia el servidor de desarrollo de Vite en `http://localhost:5173`.
- `pnpm build`: Genera el bundle estático de producción en `dist/`.
- `pnpm preview`: Sirve localmente el contenido compilado de `dist/`.
- `pnpm lint`: Ejecuta ESLint sobre el proyecto.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Ejecuta las pruebas unitarias con Vitest.

---

## 9. Integraciones y Rutas de la Aplicación

| Ruta en el Navegador      | Vista               | Acceso       | Servicio Consumido                                                      |
| :------------------------ | :------------------ | :----------- | :---------------------------------------------------------------------- |
| `/`                       | `AuthPage`          | Público      | `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password` |
| `/verify-email`           | `VerifyEmailPage`   | Público      | `POST /auth/verify-email`, `POST /auth/resend-verification`             |
| `/reset-password`         | `ResetPasswordPage` | Público      | `POST /auth/reset-password`                                             |
| `/unauthorized`           | `UnauthorizedPage`  | Público      | Vista informativa cuando el usuario autenticado no posee `ADMIN_ROLE`   |
| `/dashboard/fields`       | `Fields`            | `ADMIN_ROLE` | `server-admin` (`/fields`)                                              |
| `/dashboard/reservations` | `Reservations`      | `ADMIN_ROLE` | `server-admin` (`/reservations`)                                        |
| `/dashboard/teams`        | `Teams`             | `ADMIN_ROLE` | `server-admin` (`/teams`)                                               |
| `/dashboard/tournaments`  | `Tournaments`       | `ADMIN_ROLE` | `server-admin` (`/tournaments`)                                         |
| `/dashboard/users`        | `Users`             | `ADMIN_ROLE` | `auth-service` / `auth-node` (`GET /auth/users`, `PUT /users/:id/role`) |

---

## 10. Pruebas

La suite unitaria (`src/**/*.test.{js,jsx}`) se ejecuta con **Vitest** y **React Testing Library**:

```bash
pnpm --filter @kinal/client-admin test
```

Verifica el flujo de renovación de sesión (`src/shared/api/sessionRefresh.test.js`), asegurando que no se persistan tokens en `localStorage`, que las peticiones concurrentes ante un `401` compartan una única llamada a `/auth/refresh` y que los formularios de autenticación validen entradas correctamente.

---

## 11. Build y Despliegue en Docker

El archivo `dockerfiles/Dockerfile.client-admin` define tres etapas principales:

1. **`dev`:** Ejecuta `vite --host 0.0.0.0 --port 5173` para desarrollo con recarga en caliente.
2. **`build`:** Recibe los argumentos de compilación `ARG VITE_AUTH_URL`, `ARG VITE_ADMIN_URL` y `ARG VITE_CLOUDINARY_BASE_URL` (definidos en `docker-compose.prod.yml`) y ejecuta `pnpm build` generando `/app/dist`.
3. **`runtime`:** Copia `/app/dist` dentro de la imagen `nginxinc/nginx-unprivileged:1.27-alpine`, configura `try_files $uri $uri/ /index.html;` para soportar el enrutamiento SPA de React Router y escucha en el puerto interno `8080` (mapeado a `${CLIENT_ADMIN_PORT:-5173}:8080` en `docker-compose.prod.yml`).

---

## 12. Documentación Relacionada

- [README Principal del Monorepo](../README.md)
- [Client Admin Next — Implementación alternativa con patrón BFF en Next.js 16](../client-admin-next/README.md)
- [Server Admin — API administrativa consumida](../server-admin/README.md)
- [Auth Service (.NET 10)](../authentication-service/auth-service/README.md) y [Auth Node (Fastify)](../authentication-service/auth-node/README.md)
