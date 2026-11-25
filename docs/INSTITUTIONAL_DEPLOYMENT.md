# Despliegue institucional — KinalSports

Guía reproducible para Ubuntu 24.04 + **HestiaCP** + **Nginx** (host) + **Docker rootless**.

Este documento **no** configura HestiaCP ni el servidor: el administrador crea dominios, certificados HTTPS y proxies inversos manualmente.

> El stack **no se considera validado en producción** hasta probarse en el servidor institucional.

---

## 1. Arquitectura

```
Internet (HTTPS)
    │
    ▼
HestiaCP / Nginx (host)  — termina TLS
    │
    ├── ks-ssr.lab.kinal.edu.gt  →  http://127.0.0.1:33000  (client-admin-next)
    └── ks-csr.lab.kinal.edu.gt  →  http://127.0.0.1:33001  (institutional-gateway)
                                      │
                                      ├── estáticos SPA/PWA (dist)
                                      ├── /api/v1/*              → auth-node:3007
                                      └── /kinalSportsAdmin/v1/* → server-admin:3009

Red Docker privada `kinal_inst_network`:
  postgres, mongodb, redis, auth-node, server-admin
  (sin puertos publicados en el host)
```

### Por qué un gateway Nginx interno

Hestia solo ve `127.0.0.1`. Si las APIs no publican puertos, el Nginx del host **no** puede alcanzar `auth-node` / `server-admin`. El gateway:

1. Sirve `client-admin` como estáticos (no hay contenedor Node permanente de Vite).
2. Proxifica únicamente los prefijos públicos de API.
3. Bloquea rutas solo-servicio (`/api/v1/auth/profile/by-id`, `/by-username`).
4. Deja un único puerto CSR para Hestia (`33001`).

Next.js habla con los backends por la red Docker (`AUTH_API_URL` / `ADMIN_API_URL`); el navegador solo ve `/api/*` del BFF en el origen SSR.

### Contenedores

| Servicio              | Contenedor                     | Puerto host       | Puerto interno |
| --------------------- | ------------------------------ | ----------------- | -------------- |
| PostgreSQL 18         | `kinal_inst_postgres`          | _(ninguno)_       | 5432           |
| MongoDB 7             | `kinal_inst_mongodb`           | _(ninguno)_       | 27017          |
| Redis 7               | `kinal_inst_redis`             | _(ninguno)_       | 6379           |
| auth-node             | `kinal_inst_auth_node`         | _(ninguno)_       | 3007           |
| server-admin          | `kinal_inst_server_admin`      | _(ninguno)_       | 3009           |
| client-admin-next     | `kinal_inst_client_admin_next` | `127.0.0.1:33000` | 3000           |
| institutional-gateway | `kinal_inst_gateway`           | `127.0.0.1:33001` | 8080           |

`server-user` y el runtime `.NET` **no** forman parte de este stack (paneles admin + auth-node).

Rango propuesto de puertos: **33000–33049**. Debe verificarse en el servidor (`ss -lntp` / política del centro de datos) antes de fijar `INST_NEXT_PORT` / `INST_GATEWAY_PORT`.

---

## 2. Configurar variables

```bash
cp .env.institutional.example .env.institutional
# Editar secretos reales (nunca versionar .env.institutional)
```

Obligatorias:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET` (≥ 32 caracteres)
- `INTERNAL_SERVICE_TOKEN`
- `ALLOWED_ORIGINS`, `ADMIN_ALLOWED_ORIGINS` (orígenes HTTPS de SSR y CSR)

Generación de secretos:

```bash
openssl rand -base64 48
```

Build vs runtime: ver comentarios en `.env.institutional.example`. Tras cambiar `VITE_*`, hay que **reconstruir** el gateway (`up --build` o `build institutional-gateway`).

---

## 3. Validar Compose

```bash
./scripts/institutional/compose.sh config
# o:
docker compose -f docker-compose.institutional.yml --env-file .env.institutional config
```

---

## 4. Construir e iniciar

```bash
# Desde la raíz del monorepo
pnpm docker:inst:up
# equivalente:
./scripts/institutional/compose.sh up --build -d
```

---

## 5. Verificar estado

```bash
pnpm docker:inst:ps
./scripts/institutional/compose.sh ps
curl -fsS http://127.0.0.1:33000/api/health
curl -fsS http://127.0.0.1:33001/healthz
```

Health internos (desde un contenedor de la red, no desde el host):

```bash
docker exec kinal_inst_auth_node node -e "fetch('http://127.0.0.1:3007/api/v1/health').then(r=>console.log(r.status))"
docker exec kinal_inst_server_admin node -e "fetch('http://127.0.0.1:3009/kinalSportsAdmin/v1/health').then(r=>console.log(r.status))"
```

---

## 6. Logs

```bash
pnpm docker:inst:logs
./scripts/institutional/compose.sh logs -f --tail=200 auth-node
./scripts/institutional/compose.sh logs -f --tail=200 institutional-gateway
```

---

## 7. Reiniciar

```bash
./scripts/institutional/compose.sh restart
./scripts/institutional/compose.sh restart client-admin-next
```

---

## 8. Actualizar aplicaciones

```bash
git pull   # o el mecanismo de entrega institucional
pnpm docker:inst:up
# Solo frontends:
./scripts/institutional/compose.sh up --build -d client-admin-next institutional-gateway
```

Volúmenes de datos (`inst_*`) se conservan.

---

## 9. Rollback

1. Conservar el commit/tag anterior del código.
2. `git checkout <tag-o-commit-anterior>`
3. `pnpm docker:inst:up` para reconstruir imágenes de ese punto.
4. Si un volumen quedó en mal estado, restaurar backup de `inst_postgres18_data` / `inst_mongo_data` (procedimiento de backup del servidor; fuera de este repo).

No hay `docker compose down -v` en operación normal: borraría datos.

---

## 10. Qué configurar en HestiaCP (manual)

### Dominios y TLS

| Dominio                   | Proxy / backend          |
| ------------------------- | ------------------------ |
| `ks-ssr.lab.kinal.edu.gt` | `http://127.0.0.1:33000` |
| `ks-csr.lab.kinal.edu.gt` | `http://127.0.0.1:33001` |

Certificados Let’s Encrypt (o institucionales) en HestiaCP. Reenviar:

- `Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto` (= `https`)
- `X-Real-IP`

### Rutas relevantes (CSR vía gateway)

| Ruta                               | Destino interno                     |
| ---------------------------------- | ----------------------------------- |
| `/`, `/assets/*`, PWA              | estáticos del gateway               |
| `/api/v1/*`                        | `auth-node:3007`                    |
| `/kinalSportsAdmin/v1/*`           | `server-admin:3009`                 |
| `/api/v1/auth/profile/by-id`       | **404** en gateway (solo servicios) |
| `/api/v1/auth/profile/by-username` | **404** en gateway                  |

### Rutas relevantes (SSR / Next)

| Ruta                             | Destino               |
| -------------------------------- | --------------------- |
| `/` y páginas                    | Next.js               |
| `/api/session`, `/api/backend/*` | BFF Next → red Docker |
| `/api/health`                    | healthcheck Next      |

No crear dominios públicos independientes para las APIs.

### Opción alternativa (sin contenedor gateway)

Si el administrador prefiere servir `dist/` con el Nginx de Hestia:

1. Publicar auth-node y server-admin solo en `127.0.0.1` (justificado).
2. Configurar locations `/api/v1/` y `/kinalSportsAdmin/v1/` en el vhost CSR.
3. Copiar el artefacto `dist` al document root.

Esa vía **no** está automatizada en `docker-compose.institutional.yml`; el gateway es la opción por defecto.

---

## 11. Scripts pnpm

| Script                  | Acción                      |
| ----------------------- | --------------------------- |
| `pnpm docker:inst:up`   | `up --build -d`             |
| `pnpm docker:inst:down` | `down` (conserva volúmenes) |
| `pnpm docker:inst:logs` | `logs -f`                   |
| `pnpm docker:inst:ps`   | `ps`                        |

---

## 12. Pendientes de verificar en el servidor

- [ ] Disponibilidad real de `33000` / `33001` (y del rango 33000–33049).
- [ ] Docker rootless operativo (`docker info`, UID mapping, storage driver).
- [ ] Alcance DNS de `ks-ssr` / `ks-csr` y certificados.
- [ ] Conectividad a `mail.lab.kinal.edu.gt` / `KMH_PROJECT_API_KEY`.
- [ ] Credenciales Cloudinary de producción.
- [ ] Backup de volúmenes `inst_*`.
- [ ] Prueba de login HTTPS con `SECURE_COOKIES=true` en ambos frontends.
- [ ] Que Hestia reenvíe `X-Forwarded-Proto: https`.

---

## 13. Archivos del stack institucional

| Archivo                                         | Rol                          |
| ----------------------------------------------- | ---------------------------- |
| `docker-compose.institutional.yml`              | Orquestación                 |
| `.env.institutional.example`                    | Plantilla de variables       |
| `dockerfiles/Dockerfile.institutional-gateway`  | Build SPA + Nginx gateway    |
| `dockerfiles/nginx/institutional-gateway.conf`  | Proxy + estáticos + bloqueos |
| `scripts/institutional/compose.sh`              | Wrapper compose              |
| `client-admin-next/src/app/api/health/route.ts` | Health Next                  |
