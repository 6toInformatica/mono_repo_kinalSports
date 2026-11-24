# Pruebas de Contrato HTTP

**Ubicación en el monorepo:** `tests/contract`

Suite de pruebas automatizadas de caja negra ejecutadas con **Vitest** contra el ecosistema completo levantado en Docker. Su objetivo es fijar y verificar el **contrato HTTP real** de cada microservicio para garantizar que mejoras internas, cambios de versión o migraciones tecnológicas mantengan intacto el comportamiento esperado por los clientes.

---

## 1. Qué Evalúa cada Prueba

Cada respuesta HTTP se normaliza mediante `lib/shape.js` generando una huella determinista que compara:

- Código de estado HTTP (`status`) y formato JSON.
- Estructura completa del cuerpo de respuesta (llaves y tipos de datos).
- Valores semánticos de `success`, `message`, `error` y `status`, normalizando valores dinámicos (identificadores, marcas de tiempo, tokens y direcciones de correo).

Las huellas de referencia se almacenan en `specs/__snapshots__/`. Cualquier divergencia no intencional en códigos de estado o estructura JSON hace fallar la prueba mostrando la diferencia exacta.

---

## 2. Cobertura de Especificaciones

| Archivo                       | Alcance Verificado                                                                                                                                                                                                                                                                                                                                   |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/auth.test.js`          | Ejecuta el mismo guion contra `auth-node` (`:3007`) y `auth-service` (`:5156`): registro, verificación de correo, login, rotación de _refresh token_, logout, foto de perfil, consultas internas (`QUERY` y `POST` en `/profile/by-id` y `/by-username`), listado administrativo (`GET /auth/users`), gestión de roles y recuperación de contraseña. |
| `specs/server-admin.test.js`  | Flujos administrativos de canchas, equipos, torneos y confirmación/cancelación de reservaciones en `server-admin` (`:3009`).                                                                                                                                                                                                                         |
| `specs/server-user.test.js`   | Flujos de usuario final en `server-user` (`:3008`): consulta de perfil, reglas de negocio en reservaciones, equipos y torneos.                                                                                                                                                                                                                       |
| `specs/cross-service.test.js` | Interoperabilidad entre servicios: validez cruzada de tokens JWT entre `.NET 10` y `Node.js`, claims compartidos y consistencia de datos entre microservicios.                                                                                                                                                                                       |

---

## 3. Ejecución Paso a Paso

Desde la raíz del monorepo:

```bash
# 1. Levantar el stack con el archivo override de contrato (activa Mailpit y eleva límites de rate-limit)
pnpm contract:up

# 2. Cargar los usuarios y datos iniciales de prueba
pnpm db:seed

# 3. Ejecutar la suite de pruebas de contrato
pnpm test:contract
```

- `pnpm contract:up` combina `docker-compose.yml` con `tests/contract/compose.contract.yml`, redirigiendo el envío de correos al contenedor **Mailpit** (`http://localhost:8025`) para que las pruebas extraigan por API los tokens de verificación y restablecimiento sin enviar correos externos.
- Para volver a la configuración habitual de desarrollo: `pnpm docker:up:detached`.

---

## 4. Actualización de Snapshots

Únicamente cuando un cambio en el contrato HTTP sea intencional y haya sido revisado:

```bash
pnpm --filter @kinal/contract-tests test:update
```

Inspecciona siempre el `git diff` de `specs/__snapshots__/` antes de confirmar los cambios.

---

## 5. Diferencias Conocidas entre Implementaciones de Autenticación

La línea base documenta las siguientes particularidades verificadas entre `auth-node` y `auth-service`:

- Ambos servicios exponen las mismas rutas (`GET /auth/users`, `POST /auth/profile/picture/avatar`, `QUERY` y `POST` en `/auth/profile/by-id` y `/by-username`), pero difieren en códigos y textos de error puntuales: registro duplicado (`409` en `auth-node`, `400` en `auth-service`), token inválido de verificación (`401` en `auth-node`, `400` en `auth-service`) e idioma de algunos mensajes de validación.

---

## 6. Documentación Relacionada

- [README Principal del Monorepo](../../README.md)
- [Guía de Colaboración y Contribución](../../CONTRIBUTING.md)
