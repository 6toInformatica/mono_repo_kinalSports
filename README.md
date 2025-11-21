# KinalSports Monorepo

Este repositorio organiza todos los servicios y clientes del proyecto KinalSports como un **monorepo**.

## Estructura
- `authentication-service/`
  - `auth-node/`: Servicio de autenticación Node.js (Express).
  - `auth-service/`: Servicio de autenticación .NET.
- `server-admin/`: API administrativa (Node.js / Express).
- `server-user/`: API de usuario (Node.js / Express).
- `client-admin/`: Frontend administrativo (Vite + React).
- `client-user/`: (Pendiente / estructura futura).

## Requisitos
- Node.js (versión recomendada LTS)
- pnpm o npm (dependiendo de cómo manejes los paquetes)
- .NET SDK (para proyectos en `auth-service`)
- Git

## Instalación rápida (ejemplo para cliente admin)
```bash
cd client-admin
pnpm install # o npm install
pnpm dev     # o npm run dev
```

## Scripts sugeridos (futuros)
Se puede añadir un `package.json` raíz para orquestar scripts, por ejemplo:
```json
{
  "scripts": {
    "dev:admin": "pnpm --filter client-admin dev",
    "dev:auth-node": "pnpm --filter auth-node start"
  }
}
```

## Estándares
- Cada proyecto mantiene su propio `.gitignore` específico; el raíz agrega reglas comunes.
- Archivos `.env` nunca se versionan.
- Carpetas `uploads` ignoradas excepto placeholders `.gitkeep`.

## Próximos pasos
1. Definir estrategia de versiones y tags.
2. Añadir CI (GitHub Actions) para lint + build.
3. Consolidar documentación de APIs.

## Licencia
Pendiente de definir.
