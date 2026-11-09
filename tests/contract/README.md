# Pruebas de contrato

Pruebas HTTP de caja negra contra el stack levantado en Docker. Fijan el **contrato actual** de cada servicio para poder migrar tecnologías sin cambiar el comportamiento.

## Qué se compara

Cada respuesta se reduce a una huella (`lib/shape.js`):

- status HTTP y si la respuesta es JSON;
- estructura del body: claves y tipos;
- valores de `success`, `message`, `error` y `status`, con ids, fechas, correos y números normalizados.

Las huellas de referencia están en `specs/__snapshots__/`. Si un servicio migrado responde distinto, la prueba falla y muestra la diferencia.

## Cobertura

| Archivo                       | Servicio                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/auth.test.js`          | auth-node y auth-service con el mismo guion: registro, verificación, sesión, refresh, logout, foto, consultas internas, roles y recuperación de contraseña |
| `specs/server-admin.test.js`  | canchas, equipos, torneos y reservas del panel admin                                                                                                       |
| `specs/server-user.test.js`   | perfil, reservas y reglas de negocio, equipos y torneos de la app                                                                                          |
| `specs/cross-service.test.js` | redundancia de auth, claims compartidos y datos entre servicios                                                                                            |

## Cómo correrlas

```bash
pnpm contract:up      # stack con Mailpit y rate limits altos
pnpm db:seed          # usuarios y datos de prueba
pnpm test:contract
```

- `pnpm contract:up` usa `tests/contract/compose.contract.yml` encima del compose principal. Los correos van a Mailpit (http://localhost:8025) y las pruebas leen ahí los tokens de verificación y de restablecimiento. No se envían correos reales.
- Para volver a la configuración normal: `pnpm docker:up:detached`.
- Las subidas de imágenes válidas sí llegan a Cloudinary.

## Cuándo actualizar las huellas

Solo cuando un cambio de comportamiento es **intencional** y está revisado:

```bash
pnpm --filter @kinal/contract-tests test:update
```

Revisa el diff de `__snapshots__` antes de hacer commit.

## Comportamientos actuales anotados

La línea base registra el comportamiento tal como está, incluidos estos casos que se revisarán en la etapa de cada servicio:

- `GET /kinalSportsUser/v1/fields/:id` con un id inválido responde 500.
- Los dos servicios de auth difieren en algunos status y mensajes: registro duplicado (409 en Node, 400 en .NET), token inválido de verificación (401 en Node, 400 en .NET) y textos de error en inglés en .NET.
- Crear un torneo responde 200 en lugar de 201.
