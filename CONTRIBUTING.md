# Guía de Colaboración y Contribución (`CONTRIBUTING.md`)

**KinalSports · Fundación Kinal · Sexto Perito en Computación**

Esta guía define los lineamientos técnicos, arquitectónicos y formativos propuestos para colaborar en el monorepo **KinalSports**. Sus reglas operativas son específicas de este repositorio, no constituyen políticas institucionales oficiales de **[Fundación Kinal](https://www.kinal.org.gt/)** y se aplican de forma complementaria a las disposiciones institucionales vigentes. Adopta además referencias de ingeniería como **Conventional Commits**, **GitHub Community Standards** y prácticas profesionales de revisión de código (_Code Review_).

---

## Índice de Navegación

1. [Propósito Formativo y Técnico](#1-propósito-formativo-y-técnico)
2. [Participantes y Roles en el Repositorio](#2-participantes-y-roles-en-el-repositorio)
3. [Valores Institucionales Aplicados a la Ingeniería de Software](#3-valores-institucionales-aplicados-a-la-ingeniería-de-software)
4. [Flujo de Trabajo de Contribución (9 Pasos)](#4-flujo-de-trabajo-de-contribución-9-pasos)
5. [Convenciones Técnicas (Ramas, Commits, Pruebas y Formato)](#5-convenciones-técnicas-ramas-commits-pruebas-y-formato)
6. [Validaciones Automáticas con Husky y Commitlint](#6-validaciones-automáticas-con-husky-y-commitlint)
7. [Criterios Arquitectónicos y Protección de Información Sensible](#7-criterios-arquitectónicos-y-protección-de-información-sensible)
8. [Orientaciones sobre el Uso de Inteligencia Artificial](#8-orientaciones-sobre-el-uso-de-inteligencia-artificial)
9. [Documentación Relacionada](#9-documentación-relacionada)

---

## 1. Propósito Formativo y Técnico

Contribuir a **KinalSports** implica participar en un entorno que combina la exigencia de un sistema real de microservicios con el proceso formativo de **Sexto Perito en Computación** (`IN6AM` / `IN6AV`) en **Fundación Kinal**.

Cada cambio propuesto en este repositorio persigue dos objetivos simultáneos:

1. **Calidad de ingeniería:** Mantener la integridad funcional, la seguridad, el rendimiento y la coherencia arquitectónica entre los servicios en Node.js (`auth-node`, `server-admin`, `server-user`), la solución en `.NET 10` (`auth-service`) y las aplicaciones cliente (`client-admin`, `client-admin-next`, `client-user`).
2. **Desarrollo de competencias profesionales:** Practicar el análisis de requerimientos, la lectura de código existente, el diseño limpio, las pruebas automatizadas, la documentación técnica y la defensa argumentada de decisiones durante el _Code Review_.

---

## 2. Participantes y Roles en el Repositorio

A diferencia de un repositorio público abierto a contribuciones anónimas sin control, **KinalSports** es un monorepo académico y técnico administrado. No cualquier usuario externo cuenta con permisos de escritura directa sobre el repositorio. Se distinguen cuatro perfiles de participación:

| Perfil                                        | Alcance y Responsabilidades                                                                                                                                                                                                   |
| :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estudiantes (Sexto Perito en Computación)** | Utilizan el monorepo como referencia de arquitectura, desarrollan laboratorios, correcciones, pruebas o extensiones asignadas en ramas de trabajo o _forks_ académicos, y participan en revisiones constructivas entre pares. |
| **Responsables Técnicos**                     | Definen la arquitectura de sistemas, los contratos entre microservicios, las políticas de seguridad, la configuración de infraestructura y las guías técnicas del proyecto, encabezados por **Braulio Echeverría**.           |
| **Revisores Técnicos**                        | Evalúan Pull Requests verificando cumplimiento arquitectónico, cobertura de pruebas, ausencia de secretos, claridad del código y comprensión real por parte del autor antes de autorizar una fusión hacia `master`.           |
| **Colaboradores Externos Autorizados**        | Profesionales, docentes invitados o colaboradores con autorización explícita de los administradores del repositorio que aportan mejoras técnicas, auditorías o correcciones mediante Pull Requests revisados.                 |

---

## 3. Valores Institucionales Aplicados a la Ingeniería de Software

La colaboración en **KinalSports** traduce los valores formativos de **[Fundación Kinal](https://www.kinal.org.gt/quienes-somos)** en prácticas de ingeniería verificables:

### 3.1 Trabajo Bien Hecho

En el desarrollo de software, el **trabajo bien hecho** no consiste únicamente en que una función parezca operar en el camino feliz (_happy path_), sino en entregar soluciones completas y confiables:

- Resolver la causa raíz del problema y no solo ocultar el síntoma.
- Mantener la claridad en nombres de variables, funciones, clases y contratos HTTP.
- Respetar el patrón arquitectónico propio de cada componente (Hexagonal, Clean Architecture, Modular, Por Capas, SPA o BFF) sin introducir atajos que rompan el aislamiento entre capas.
- Evitar complejidad innecesaria o dependencias injustificadas.
- Incorporar o actualizar las pruebas unitarias y de contrato cuando el cambio lo requiera.
- Documentar decisiones relevantes, cambios de configuración y variables de entorno.
- **No trasladar defectos conocidos, código sin probar ni advertencias de linter a otros integrantes del equipo.**

### 3.2 Espíritu de Servicio

El desarrollo en equipo dentro de un monorepo requiere pensar en quienes leerán, operarán y mantendrán el código después:

- Colaborar activamente con los compañeros cuando enfrenten bloqueos técnicos de configuración, compilación o arquitectura.
- Compartir conocimiento técnico explicando el porqué de una solución, sin sustituir el esfuerzo ni apropiarse del aprendizaje ajeno.
- Realizar revisiones de código (_Code Reviews_) constructivas, señalando oportunidades de mejora con fundamento técnico y proponiendo alternativas claras.
- Mantener una comunicación respetuosa y profesional en Issues, commits y Pull Requests.

### 3.3 Respeto a la Dignidad de la Persona

- Dirigir toda observación en el _Code Review_ al diseño, la arquitectura o la implementación, nunca a la capacidad personal del autor.
- Valorar el proceso de aprendizaje de cada estudiante y reconocer las contribuciones de todos los participantes.

### 3.4 Libertad Personal Responsable

- Tomar decisiones técnicas fundamentadas en el estudio del código fuente y asumir la responsabilidad sobre el impacto de cada commit en los servicios compartidos.
- Emplear las herramientas de Inteligencia Artificial con juicio crítico, verificación empírica y protección de credenciales (ver [Sección 8](#8-orientaciones-sobre-el-uso-de-inteligencia-artificial)).

### 3.5 Visión Cristiana de la Vida

- Reconocerla como parte de la identidad formativa de Fundación Kinal, reflejada en este proyecto mediante la honestidad intelectual, la integridad académica, el respeto mutuo y el servicio a través de un trabajo técnico bien realizado.

---

## 4. Flujo de Trabajo de Contribución (9 Pasos)

Toda contribución técnica debe seguir ordenadamente estas nueve etapas:

### Paso 1. Comprender el requerimiento

Antes de escribir código, identifica qué problema de negocio o técnico se resuelve, qué componente(s) del monorepo intervienen y si existe un Issue o especificación asociada. Si detectas un defecto o propones una mejora, regístrala utilizando las plantillas en [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE/).

### Paso 2. Revisar la arquitectura del componente

Inspecciona el `README.md` del servicio o cliente afectado y consulta [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md):

- **`auth-node`:** Arquitectura Hexagonal (`modules/*/application` -> `interface/http` -> `infrastructure`).
- **`auth-service`:** Clean Architecture en `.NET 10` (`Domain`, `Application`, `Infrastructure`, `Persistence`, `Api`).
- **`server-admin`:** Arquitectura Modular en NestJS (`modules`, `guards`, `pipes`, `interceptors`).
- **`server-user`:** Arquitectura por Capas en Express 5 (`routes` -> `controller` -> `service` -> `repository`).
- **`client-admin` y `client-user`:** Organización modular por _features_ (`src/features/*`, `src/shared/*`).
- **`client-admin-next`:** Patrón Backend for Frontend (`src/server/*`, `src/proxy.ts`, `src/app/api/*`).

### Paso 3. Crear una rama de trabajo

Sincroniza la rama principal (`master`) y crea una rama descriptiva siguiendo la convención de nombres:

```bash
git checkout master
git pull origin master
git checkout -b feat/server-user-filtro-canchas
```

### Paso 4. Implementar el cambio

Desarrolla la solución manteniendo la cohesión del cambio. Evita mezclar en una misma rama refactorizaciones masivas no relacionadas con la funcionalidad o corrección solicitada.

### Paso 5. Ejecutar pruebas y verificaciones locales

Verifica que el linter, el compilador y las suites de pruebas pasen sin errores:

```bash
pnpm lint
pnpm test
pnpm -r --if-present build
```

Si modificaste rutas HTTP, códigos de estado, validaciones de entrada o respuestas JSON en algún microservicio, ejecuta también las pruebas de contrato:

```bash
pnpm contract:up
pnpm db:seed
pnpm test:contract
```

### Paso 6. Actualizar la documentación

Si tu cambio incorpora o modifica endpoints, variables de entorno, scripts, puertos o reglas de negocio:

- Actualiza el archivo `.env.example` o `appsettings.Development.example.json` correspondiente (sin incluir secretos reales).
- Actualiza el `README.md` del componente modificado y, si el cambio es transversal, la documentación en `docs/`.

### Paso 7. Crear el Pull Request

Envía tu rama al repositorio remoto y abre un Pull Request hacia `master` completando todas las secciones aplicables de [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).

### Paso 8. Participar en el Code Review

Atiende las observaciones de los revisores técnicos o compañeros. Responde cada comentario explicando el ajuste aplicado o argumentando técnicamente la decisión tomada, manteniendo siempre un trato profesional conforme a [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

### Paso 9. Integrar los cambios aprobados

Una vez aprobada la revisión técnica, resueltos los conflictos si existieran y verificadas todas las pruebas automatizadas, el cambio podrá integrarse en la rama `master`.

---

## 5. Convenciones Técnicas (Ramas, Commits, Pruebas y Formato)

### 5.1 Nomenclatura de ramas

Utiliza el formato `<prefijo>/<componente>-<descripcion-corta>` en `kebab-case`:

- `feat/<componente>-<descripcion>`: Nueva funcionalidad (ej. `feat/server-admin-exportar-torneos`).
- `fix/<componente>-<descripcion>`: Corrección de defecto (ej. `fix/auth-node-rotacion-refresh-token`).
- `docs/<componente>-<descripcion>`: Creación o actualización documental (ej. `docs/monorepo-arquitectura-c4`).
- `refactor/<componente>-<descripcion>`: Mejora estructural sin cambiar el contrato externo.
- `test/<componente>-<descripcion>`: Adición o fortalecimiento de pruebas unitarias o de contrato.
- `chore/<componente>-<descripcion>`: Mantenimiento de herramientas, dependencias o scripts.

### 5.2 Estructura de mensajes de commit (Conventional Commits)

El repositorio exige la especificación **Conventional Commits** validada por `commitlint.config.cjs` (`@commitlint/config-conventional`):

```text
<tipo>(<scope opcional>): <descripción breve en minúsculas o sentence-case sin punto final>

[cuerpo opcional con líneas de máximo 120 caracteres]
```

- **Tipos permitidos:** `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`, `style`, `revert`.
- **Reglas configuradas en `commitlint.config.cjs`:**
  - `subject-case`: Nivel de error (`2`), admite únicamente `sentence-case` o `lower-case` y prohíbe punto final.
  - `body-max-line-length`: Nivel de advertencia (`1`), máximo `120` caracteres por línea.
- **Scopes recomendados:** `auth-node`, `auth-service`, `server-admin`, `server-user`, `client-admin`, `client-admin-next`, `client-user`, `contract-tests`, `docker`, `seed`, `docs`.

**Ejemplos verificados:**

```bash
git commit -m "feat(server-admin): agregar filtro por tipo de superficie en canchas"
git commit -m "fix(auth-node): invalidar cache de perfil al verificar correo"
git commit -m "docs(auth-service): actualizar guia de recreacion a net10.0"
```

Puedes utilizar el asistente interactivo de Commitizen configurado en la raíz:

```bash
pnpm commit
```

### 5.3 Lint, Formato y Pruebas

- **ESLint (`pnpm lint`):** Configurado con `--max-warnings=0` en `lint-staged`; cualquier advertencia bloquea el commit.
- **Prettier (`pnpm format`):** Aplica formato uniforme a código JavaScript/TypeScript, JSON, CSS, YAML y Markdown.
- **Formato C# (`dotnet format`):** Aplica las reglas de `.editorconfig` sobre `authentication-service/auth-service/AuthService.sln`.
- **Pruebas (`pnpm test`):** Toda funcionalidad nueva o corrección de bug debe incluir pruebas que verifiquen el comportamiento esperado y los casos borde.

### 5.4 Pull Requests y Resolución de Conflictos

- Mantén cada Pull Request enfocado en un objetivo claro y verificable.
- Si tu rama presenta conflictos con `master`, sincronízala localmente (`git fetch origin && git merge origin/master` o `git rebase origin/master`), resuelve los conflictos preservando el trabajo de tus compañeros y vuelve a ejecutar `pnpm lint && pnpm test` antes de actualizar el PR.

---

## 6. Validaciones Automáticas con Husky y Commitlint

El directorio `.husky/` ejecuta automáticamente tres controles locales en el flujo de Git:

| Hook de Git      | Archivo                                    | Verificación Ejecutada                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pre-commit`** | [`.husky/pre-commit`](./.husky/pre-commit) | 1. Ejecuta `pnpm lint-staged`: formatea con `prettier --write --ignore-unknown` (`.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, `.md`, `.yaml`, `.yml`) y valida con `eslint --fix --max-warnings=0` los archivos de código modificados.<br>2. Ejecuta `dotnet format authentication-service/auth-service/AuthService.sln` para verificar el estilo de código en C# (`.NET 10`). |
| **`commit-msg`** | [`.husky/commit-msg`](./.husky/commit-msg) | Ejecuta `pnpm exec commitlint --edit "$1"` comprobando que el mensaje cumpla `commitlint.config.cjs`.                                                                                                                                                                                                                                                                                            |
| **`pre-push`**   | [`.husky/pre-push`](./.husky/pre-push)     | Ejecuta `pnpm test` (todas las suites unitarias de Node.js, React, React Native y `.NET 10`) antes de enviar commits al remoto.                                                                                                                                                                                                                                                                  |

> **Importante:** No utilices `--no-verify` para evadir los hooks de calidad salvo indicación expresa del responsable técnico ante una contingencia documentada.

---

## 7. Criterios Arquitectónicos y Protección de Información Sensible

Todo Pull Request se evalúa contra las siguientes invariantes técnicas del monorepo:

1. **Prohibición absoluta de secretos en el repositorio:**
   - Nunca agregues al control de versiones archivos `.env`, `.env.local`, `.env.docker`, `appsettings.Development.json`, certificados privados ni credenciales reales (`JWT_SECRET`, `INTERNAL_SERVICE_TOKEN`, `KMH_PROJECT_API_KEY`, `CLOUDINARY_API_SECRET`, `POSTGRES_PASSWORD`).
2. **Almacenamiento seguro de sesión:**
   - En `client-admin` y `client-admin-next`, los tokens de acceso y refresco deben viajar exclusivamente en cookies `httpOnly` (`kinal_access` y `kinal_refresh`); está prohibido persistirlos en `localStorage` o `sessionStorage`.
   - En `client-user`, las credenciales deben resguardarse únicamente mediante `expo-secure-store`.
3. **Paridad e interoperabilidad de autenticación:**
   - `auth-node` y `auth-service` comparten la base de datos PostgreSQL 18 (`kinal_sports`). Cualquier cambio en tablas, claims del JWT o endpoints `/api/v1/auth/*` y `/api/v1/users/*` debe mantener la compatibilidad entre ambos servicios.
4. **Coherencia de caché en Redis:**
   - Toda mutación sobre canchas (`fields`) debe invalidar el prefijo `kinal:fields:`.
   - Toda mutación sobre perfil, fotografía, verificación de correo o rol de usuario debe invalidar `kinal:user:profile:<userId>`.

---

## 8. Orientaciones sobre el Uso de Inteligencia Artificial

En coherencia con el valor institucional de **libertad personal responsable** y **trabajo bien hecho**, las herramientas de Inteligencia Artificial (asistentes de código, modelos de lenguaje o autocompletado inteligente) pueden utilizarse como apoyo técnico y formativo bajo las siguientes reglas obligatorias:

1. **Comprensión íntegra del código:** El autor de un commit o Pull Request debe comprender línea por línea qué hace el código que entrega, cómo se integra con la arquitectura del servicio y qué implicaciones tiene en seguridad y rendimiento. No es aceptable entregar código generado automáticamente que el autor no sepa explicar o depurar.
2. **Verificación obligatoria:** Toda sugerencia generada por IA debe contrastarse con la fuente de verdad del repositorio y validarse mediante compilación (`build`), análisis estático (`pnpm lint`, `dotnet format`) y pruebas automatizadas (`pnpm test`).
3. **Protección de secretos y datos sensibles:** Jamás compartas en prompts o servicios externos de IA contraseñas, tokens internos (`INTERNAL_SERVICE_TOKEN`, `JWT_SECRET`), llaves de API (`KMH_PROJECT_API_KEY`, `CLOUDINARY_API_SECRET`), cadenas de conexión productivas ni datos personales de estudiantes o colaboradores.
4. **Respeto a licencias y derechos de terceros:** Verifica que cualquier fragmento incorporado sea compatible con la licencia **MIT** del proyecto y no vulnere derechos de autor ni copie soluciones de otros compañeros sin atribución.
5. **Mismos estándares de calidad:** Toda contribución será evaluada con idéntico rigor técnico y arquitectónico en el _Code Review_, independientemente de si fue escrita de forma manual o con apoyo de IA.
6. **Transparencia:** Declara el uso relevante de herramientas de IA en la sección correspondiente de la plantilla de Pull Request o según los requisitos específicos de la actividad académica o revisión técnica aplicable.

---

## 9. Documentación Relacionada

- [README Principal del Monorepo](./README.md)
- [Código de Conducta (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md)
- [Política de Seguridad (`SECURITY.md`)](./SECURITY.md)
- [Arquitectura Detallada del Sistema (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)
- [Guía de Desarrollo, Operación y Solución de Problemas (`docs/DEVELOPMENT_AND_OPERATIONS.md`)](./docs/DEVELOPMENT_AND_OPERATIONS.md)
