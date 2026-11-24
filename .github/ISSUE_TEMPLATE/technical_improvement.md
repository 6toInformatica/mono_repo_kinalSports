---
name: Mejora Técnica o Arquitectónica
about: Propón una refactorización, optimización de rendimiento, mejora de pruebas o actualización técnica
title: "refactor(<componente>): <descripción breve de la mejora técnica>"
labels: ["technical-improvement"]
assignees: ""
---

## 1. Componente(s) o Área Técnica

- **Componente(s):** (`auth-node` / `auth-service` / `server-admin` / `server-user` / `client-admin` / `client-admin-next` / `client-user` / `tests/contract` / `docker`)
- **Categoría:** (Arquitectura / Rendimiento y Caché / Pruebas Automatizadas / Seguridad / Tipado y Calidad de Código / Docker)

## 2. Situación Actual y Motivación

Describe qué limitación técnica, deuda arquitectónica o cuello de botella existe actualmente y por qué conviene atenderlo.

## 3. Cambios Técnicos Propuestos

Explica la solución técnica propuesta indicando qué capas, módulos o archivos se modificarán y cómo se preservará el contrato externo.

## 4. Plan de Verificación

- [ ] Las pruebas unitarias (`pnpm test`) y el linter (`pnpm lint`) continúan pasando sin regresiones.
- [ ] Las pruebas de contrato HTTP (`pnpm test:contract`) confirman que no se rompió la compatibilidad entre servicios.
