---
name: Propuesta de Funcionalidad (Feature Request)
about: Propón una nueva capacidad funcional, endpoint o flujo de interfaz para KinalSports
title: "feat(<componente>): <descripción breve de la funcionalidad>"
labels: ["enhancement"]
assignees: ""
---

## 1. Componente(s) Involucrado(s)

Indica qué servicios o clientes participan (`auth-node`, `auth-service`, `server-admin`, `server-user`, `client-admin`, `client-admin-next`, `client-user`):

- **Componentes:**

## 2. Problema o Necesidad que Resuelve

Describe qué necesidad del complejo deportivo, de los administradores o de los jugadores atiende esta funcionalidad.

## 3. Propuesta de Diseño Técnico

Detalla los elementos aplicables:

- **Rutas y verbos HTTP (`GET`, `POST`, `QUERY`, `PUT`, `PATCH`, `DELETE`):**
- **Impacto en persistencia (PostgreSQL `kinal_sports` / MongoDB `kinalSports`):**
- **Impacto en caché Redis (`kinal:fields:*` / `kinal:user:profile:*`):**
- **Consideraciones de autorización (`ADMIN_ROLE` / `USER_ROLE` / `x-internal-token`):**

## 4. Criterios de Aceptación

- [ ] Respeta la arquitectura interna del componente afectado.
- [ ] Mantiene la paridad entre `auth-node` y `auth-service` (si involucra autenticación).
- [ ] Incluye pruebas unitarias y/o actualización de pruebas de contrato.
- [ ] Actualiza la documentación correspondiente.
