## Descripción del Cambio

Describe con precisión técnica qué problema resuelve este Pull Request o qué funcionalidad incorpora.

### Componente(s) Modificado(s)

Marca con una `x` los paquetes o áreas involucradas:

- [ ] `auth-node` (`authentication-service/auth-node`)
- [ ] `auth-service` (`authentication-service/auth-service` — .NET 10)
- [ ] `server-admin` (`server-admin` — NestJS)
- [ ] `server-user` (`server-user` — Express 5)
- [ ] `client-admin` (`client-admin` — React + Vite)
- [ ] `client-admin-next` (`client-admin-next` — Next.js BFF)
- [ ] `client-user` (`client-user` — React Native + Expo)
- [ ] `tests/contract` (Pruebas de contrato HTTP)
- [ ] Infraestructura (`dockerfiles/`, `docker-compose*.yml`, `scripts/seed/`)
- [ ] Documentación y gobernanza (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, etc.)

---

## Procedimiento de Verificación

Indica los comandos o pasos exactos para verificar el cambio:

1. ...
2. ...

---

## Lista de Verificación Técnica y de Calidad

- [ ] El código compila sin errores (`pnpm -r --if-present build`).
- [ ] Los analizadores estáticos pasan sin errores ni advertencias (`pnpm lint` y `dotnet format` cuando aplica).
- [ ] Las pruebas unitarias de Node.js y .NET 10 pasan en su totalidad (`pnpm test`).
- [ ] Si se modificó el contrato de autenticación, se mantuvo la compatibilidad entre `auth-node` y `auth-service`.
- [ ] Si se modificaron mutaciones de canchas o perfiles de usuario, se preserva la invalidación de caché en **Redis**.
- [ ] No se almacenan tokens JWT ni _refresh tokens_ en `localStorage` o `sessionStorage` y no se expone ningún secreto ni credencial en el diff.
- [ ] La documentación (`.env.example` y `README.md` del servicio correspondiente) fue actualizada para reflejar el cambio.
- [ ] Comprendo íntegramente la solución entregada y, en caso de haber utilizado asistentes de IA como apoyo, verifiqué manualmente su exactitud técnica y declaro su uso con transparencia.
