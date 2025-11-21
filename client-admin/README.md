# Client Admin - Panel Administrativo Web

Frontend web para administradores de la plataforma KinalSports construido con React 19 y Vite.

## 📋 Descripción

Aplicación web SPA (Single Page Application) que permite a administradores gestionar campos deportivos, confirmar/rechazar reservas, administrar usuarios, torneos y equipos. Consume los servicios de autenticación y management API.

## 🛠️ Tech Stack

- **Framework**: React 19.2
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM 7.x
- **UI Components**: Material Tailwind React 2.x
- **Styling**: TailwindCSS 4.x
- **Icons**: Heroicons React 2.x
- **HTTP Client**: Axios (a configurar)
- **State Management**: Context API / Zustand (a configurar)

## 🚀 Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# O específicamente este servicio
pnpm --filter client-admin install
```

## ⚙️ Variables de Entorno

Crear archivo `.env` en `client-admin/`:

```env
# API Endpoints
VITE_AUTH_API_URL=http://localhost:3001/api
VITE_ADMIN_API_URL=http://localhost:3002/api

# Environment
VITE_APP_ENV=development

# Optional
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

## 📂 Estructura

```
client-admin/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── img/
│   │       └── kinal_sports.png
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.jsx
│   │       └── RegisterForm.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   └── DashboardPage.jsx
│   ├── routes/
│   │   └── AppRoutes.jsx
│   ├── services/
│   │   └── (API services)
│   ├── shared/
│   │   └── (componentes compartidos)
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo con HMR (Hot Module Replacement)
pnpm --filter client-admin dev

# Build para producción
pnpm --filter client-admin build

# Preview de build
pnpm --filter client-admin preview

# Lint
pnpm --filter client-admin lint
```

## 🖥️ Páginas y Rutas

### Páginas Actuales

- `/` - AuthPage (Login/Register)
- `/dashboard` - DashboardPage (Requiere autenticación)

### Páginas Planificadas

- `/dashboard/fields` - Gestión de campos deportivos
- `/dashboard/fields/new` - Crear nuevo campo
- `/dashboard/fields/:id/edit` - Editar campo
- `/dashboard/reservations` - Lista de reservas pendientes
- `/dashboard/reservations/:id` - Detalles de reserva
- `/dashboard/users` - Gestión de usuarios
- `/dashboard/tournaments` - Gestión de torneos
- `/dashboard/teams` - Gestión de equipos
- `/dashboard/reports` - Reportes y estadísticas

## 🔐 Autenticación

### Flujo de Autenticación

1. Usuario ingresa credenciales en `LoginForm`
2. POST a `VITE_AUTH_API_URL/auth/login`
3. Respuesta contiene JWT token
4. Token se guarda en localStorage/sessionStorage
5. Token se incluye en headers de requests subsecuentes:
   ```javascript
   Authorization: Bearer <token>
   ```

### Protected Routes

```javascript
// Ejemplo de ruta protegida
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## 🎨 UI Components

### Material Tailwind

Usa componentes pre-construidos de Material Tailwind:

```javascript
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
} from "@material-tailwind/react";
```

### Heroicons

```javascript
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
```

## 📡 Servicios API

### Auth Service

```javascript
// services/authService.js
const login = async (credentials) => {
  const response = await axios.post(
    `${import.meta.env.VITE_AUTH_API_URL}/auth/login`,
    credentials,
  );
  return response.data;
};
```

### Admin Service

```javascript
// services/adminService.js
const getFields = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_ADMIN_API_URL}/fields`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  return response.data;
};
```

## 🔗 Dependencias con Otros Servicios

- **auth-node / auth-service**: Login, registro, gestión de perfil
- **server-admin**: Gestión de campos, reservas, torneos
- Ambos servicios deben estar corriendo para funcionalidad completa

## 🎨 Estilos y Theming

### TailwindCSS Config

```javascript
// tailwind.config.js (si se crea)
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#your-color",
      },
    },
  },
  plugins: [],
};
```

### CSS Global

Estilos globales en `src/index.css`

## 🚀 Build y Deployment

### Build para Producción

```bash
pnpm --filter client-admin build
```

Genera carpeta `dist/` con assets optimizados.

### Preview Local

```bash
pnpm --filter client-admin preview
```

### Deploy (Ejemplos)

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# Static hosting
cp -r dist/* /var/www/html/
```

## ⚠️ Compatibilidad de Dependencias

**Nota**: Material Tailwind React 2.1.10 espera React ^16 || ^17 || ^18, pero el proyecto usa React 19.2.

### Soluciones:

1. **Downgrade a React 18** (recomendado por estabilidad):

   ```bash
   pnpm --filter client-admin add react@18 react-dom@18
   ```

2. **Esperar actualización** de Material Tailwind para React 19

3. **Usar alternativas**:
   - Headless UI + Tailwind
   - shadcn/ui
   - DaisyUI
   - Flowbite React

## 📝 Notas de Desarrollo

- Vite dev server corre en `http://localhost:5173` por defecto
- HMR (Hot Module Replacement) activado
- Fast Refresh para React
- Variables de entorno deben prefijarse con `VITE_`
- Assets en `public/` se sirven desde raíz
- ESLint configurado con reglas para React Hooks y React Refresh

## 🧪 Testing (Pendiente)

```bash
# Vitest (recomendado para Vite)
pnpm --filter client-admin add -D vitest @testing-library/react @testing-library/jest-dom

# React Testing Library
pnpm --filter client-admin test
```

## 🚀 Próximas Funcionalidades

- [ ] Dashboard completo con estadísticas
- [ ] CRUD de campos deportivos con upload de imágenes
- [ ] Gestión de reservas (aprobar/rechazar/cancelar)
- [ ] Gestión de usuarios (cambio de roles, activar/desactivar)
- [ ] CRUD de torneos y equipos
- [ ] Reportes y analytics (gráficos con Chart.js / Recharts)
- [ ] Notificaciones en tiempo real (WebSockets / SSE)
- [ ] Búsqueda y filtros avanzados
- [ ] Exportación de datos (CSV, PDF)
- [ ] Tema oscuro / claro

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
