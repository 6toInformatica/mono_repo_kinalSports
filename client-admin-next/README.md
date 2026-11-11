# Client Admin Next

Panel de administración de Kinal Sports en Next.js 16 (App Router). Tiene la misma funcionalidad que `client-admin`, contra los mismos backends (auth-service y server-admin), con sesión más segura y una vista general nueva.

## Sesión

- Los tokens se guardan en cookies httpOnly (`kinal_access`, `kinal_refresh`, `kinal_user`); el JavaScript del navegador no puede leerlos.
- `POST /api/session` inicia sesión (solo `ADMIN_ROLE`), `GET` devuelve el usuario y `DELETE` cierra la sesión y revoca el refresh token.
- `/api/backend/{auth|admin}/...` reenvía las llamadas al backend con el token. Si el token venció, lo renueva una vez y reintenta. Si no se puede renovar, responde con el header `x-session-expired` y la app vuelve al login.
- `src/proxy.ts` protege `/dashboard` desde el servidor y renueva el token antes de mostrar la página.
- Las rutas que cambian estado verifican el header `Origin` (protección CSRF).

## Estructura

```
src/
├── app/            # Rutas: login, dashboard/*, verify-email, reset-password, api/*
├── features/       # auth, overview, fields, reservations, teams, tournaments, users, layout
├── shared/         # api (cliente del navegador), lib (formatos, imágenes, formularios), ui (componentes)
├── server/         # Código solo de servidor: cookies, llamadas a auth, usuario actual
└── proxy.ts
```

## Variables

Copia `.env.example` a `.env.local`:

| Variable                          | Uso                                                 |
| --------------------------------- | --------------------------------------------------- |
| `AUTH_API_URL`                    | URL de auth-service (solo servidor)                 |
| `ADMIN_API_URL`                   | URL de server-admin (solo servidor)                 |
| `NEXT_PUBLIC_CLOUDINARY_BASE_URL` | Base para mostrar imágenes guardadas como public_id |

## Comandos

```bash
pnpm --filter @kinal/client-admin-next dev     # http://localhost:3000
pnpm --filter @kinal/client-admin-next build
pnpm --filter @kinal/client-admin-next lint
```
