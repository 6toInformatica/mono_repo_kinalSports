## Descripción del Cambio

Describe de forma clara y concisa qué problema resuelve este Pull Request o qué funcionalidad agrega.

### Servicio(s) o Cliente(s) Afectados

Marca con una `x` los paquetes modificados:

- [ ] `auth-node` (`authentication-service/auth-node`)
- [ ] `auth-service` (`authentication-service/auth-service` - .NET 10)
- [ ] `server-admin` (`server-admin`)
- [ ] `server-user` (`server-user`)
- [ ] `client-admin` (`client-admin` - React + Vite)
- [ ] `client-admin-next` (`client-admin-next` - Next.js BFF)
- [ ] `client-user` (`client-user` - React Native Expo)
- [ ] `tests/contract` (Pruebas de contrato)
- [ ] Infraestructura / Docker / Documentación

---

## Cómo Probar este Cambio

1. ...
2. ...
3. ...

---

## Checklist de Verificación Antes de Hacer Merge

- [ ] El código compila sin errores (`pnpm -r --if-present build`).
- [ ] Todos los linters pasan sin errores ni warnings (`pnpm lint`).
- [ ] Todas las pruebas unitarias de Node.js y .NET 10 pasan (`pnpm test`).
- [ ] Si se modificó un endpoint de autenticación, se mantuvo la paridad entre `auth-node` y `auth-service`.
- [ ] Si se modificó una mutación de canchas o perfiles, se verifica la invalidación correspondiente en **Redis**.
- [ ] No se almacenan tokens JWT ni refresh tokens en `localStorage` / `sessionStorage`.
- [ ] Si se agregaron variables de entorno, fueron documentadas en `.env.example` y en el `README.md` del servicio.
