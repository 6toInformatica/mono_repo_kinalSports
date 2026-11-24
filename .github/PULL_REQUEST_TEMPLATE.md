## 1. Descripción del Cambio

Explica de manera clara y concisa qué realiza este Pull Request y cómo se implementó la solución.

## 2. Problema Resuelto o Requerimiento Atendido

Describe el defecto corregido, la funcionalidad implementada o la mejora aplicada. Si existe un Issue asociado, enlázalo aquí (por ejemplo, `Closes #<número>` o `Relacionado con #<número>`).

## 3. Componente(s) Afectado(s)

Marca con una `x` los paquetes o áreas modificadas:

- [ ] `auth-node` (`authentication-service/auth-node` — Fastify 5 + TypeScript)
- [ ] `auth-service` (`authentication-service/auth-service` — ASP.NET Core 10)
- [ ] `server-admin` (`server-admin` — NestJS 12)
- [ ] `server-user` (`server-user` — Express 5)
- [ ] `client-admin` (`client-admin` — React 19 + Vite 8)
- [ ] `client-admin-next` (`client-admin-next` — Next.js 16 BFF)
- [ ] `client-user` (`client-user` — React Native + Expo)
- [ ] `tests/contract` (Pruebas de contrato HTTP)
- [ ] Infraestructura (`dockerfiles/`, `docker-compose*.yml`, `scripts/seed/`)
- [ ] Documentación y gobernanza (`README.md`, `docs/`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`)

## 4. Tipo de Cambio

- [ ] `feat`: Nueva funcionalidad
- [ ] `fix`: Corrección de error (_bug fix_)
- [ ] `refactor`: Mejora técnica o arquitectónica sin alterar el comportamiento externo
- [ ] `test`: Adición o actualización de pruebas unitarias o de contrato
- [ ] `docs`: Creación o actualización de documentación
- [ ] `chore` / `build`: Ajuste de configuración, scripts o dependencias

## 5. Pruebas y Evidencias de Verificación

Indica los comandos ejecutados y describe brevemente la evidencia obtenida (salida de pruebas, petición HTTP verificada o comportamiento en interfaz):

1. Comandos ejecutados (`pnpm test`, `pnpm lint`, `pnpm test:contract`, etc.):
2. Resultado observado:

## 6. Consideraciones de Seguridad y Caché

- [ ] No se incluyen archivos `.env`, `.env.docker`, `appsettings.Development.json` ni secretos reales en el diff.
- [ ] En clientes web (`client-admin`, `client-admin-next`), no se almacenan tokens JWT ni _refresh tokens_ en `localStorage` o `sessionStorage`.
- [ ] Si se modificó autenticación o roles, se conserva la paridad entre `auth-node` y `auth-service`.
- [ ] Si se modificaron mutaciones de canchas o perfiles de usuario, se mantiene la invalidación de claves en **Redis** (`kinal:fields:*` o `kinal:user:profile:<userId>`).

## 7. Documentación

- [ ] No requiere cambios documentales.
- [ ] Se actualizó el `README.md`, `.env.example` o la documentación en `docs/` correspondiente al cambio.

## 8. Uso de Herramientas de Inteligencia Artificial (Cuando Corresponda)

- [ ] No se utilizaron herramientas generativas de IA para este cambio.
- [ ] Se utilizó IA como apoyo técnico; comprendo íntegramente el código entregado y verifiqué manualmente su funcionamiento, arquitectura y pruebas conforme a [`CONTRIBUTING.md`](../CONTRIBUTING.md).

## 9. Checklist Final de Revisión

- [ ] El código compila sin errores (`pnpm -r --if-present build`).
- [ ] Los analizadores estáticos pasan sin errores ni advertencias (`pnpm lint` y `dotnet format` cuando aplica).
- [ ] Las pruebas unitarias pasan en su totalidad (`pnpm test`).
- [ ] El cambio respeta la arquitectura del componente y el principio institucional de **trabajo bien hecho**.
