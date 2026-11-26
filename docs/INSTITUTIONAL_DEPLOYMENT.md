# Despliegue institucional — KinalSports

Guía reproducible para Ubuntu 24.04 + **HestiaCP** + **Nginx** (host) + **Docker rootful**.

En el servidor, Docker se administra con `sudo`. El operador previsto es `braulioecheverria`. Este documento **no** configura HestiaCP ni el servidor: ese operador crea dominios, certificados HTTPS y proxies inversos manualmente.

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
  postgres, mongodb (con autenticación), redis (caché sin disco),
  auth-node, server-admin
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
| MongoDB 7 (auth)      | `kinal_inst_mongodb`           | _(ninguno)_       | 27017          |
| Redis 7 (sin disco)   | `kinal_inst_redis`             | _(ninguno)_       | 6379           |
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
- `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`
- `MONGO_APP_USERNAME`, `MONGO_APP_PASSWORD` (distinto del root; solo `[A-Za-z0-9]`)
- `JWT_SECRET` (≥ 32 caracteres)
- `INTERNAL_SERVICE_TOKEN`
- `ALLOWED_ORIGINS`, `ADMIN_ALLOWED_ORIGINS` (orígenes HTTPS de SSR y CSR)

Generación de secretos:

```bash
openssl rand -base64 48   # JWT, token interno, PostgreSQL
openssl rand -hex 24      # contraseñas de MongoDB (la URI no las codifica)
```

`--env-file` solo sustituye `${VAR}` en Compose. El archivo **no** se monta dentro de los contenedores. `auth-node` recibe PostgreSQL, JWT, Redis, CORS, Cloudinary de perfiles y Kinal Mail Hub. `server-admin` recibe MongoDB, JWT, Redis, CORS admin y Cloudinary de canchas, equipos y torneos. `client-admin-next` solo recibe las URLs internas del BFF y `SECURE_COOKIES`.

### MongoDB

El entrypoint de `mongo:7` crea el usuario root en `admin` y arranca con `--auth`. `dockerfiles/mongo/institutional-init-app-user.js` crea, en el primer arranque, un usuario con rol `readWrite` únicamente sobre `MONGO_DB_NAME`. `server-admin` se conecta con ese usuario (`authSource` = la misma base).

Esos usuarios se crean solo si `inst_mongo_data` está vacío. No reutilizar un volumen inicializado sin autenticación: `--auth` quedaría activo y el script de init no volvería a ejecutarse.

### Redis

La aplicación usa Redis como caché Cache-Aside (perfiles, 60 s; listados de canchas, 120 s). No guarda sesiones ni colas. El servicio arranca con `--save ""` y `--appendonly no`, y no tiene volumen: un reinicio vacía la caché y los servicios la reconstruyen. No publica puerto y no exige contraseña.

### Correo

`auth-node` sigue usando Kinal Mail Hub (`MAIL_PROVIDER=kmh`, `KMH_API_BASE_URL`, `KMH_PROJECT_API_KEY`, `KMH_MAIL_FROM`) y el `extra_host` de `mail.lab.kinal.edu.gt`. Esas variables no se copian a `server-admin`.

Build vs runtime: ver comentarios en `.env.institutional.example`. Tras cambiar `VITE_*`, hay que **reconstruir** el gateway (`up --build` o `build institutional-gateway`).

---

## 3. Validar Compose

En el servidor (Docker rootful):

```bash
sudo ./scripts/institutional/compose.sh config
```

El wrapper llama a `docker compose` sin `sudo`. En el servidor hay que invocarlo con `sudo`. En una estación con acceso directo al socket de Docker:

```bash
./scripts/institutional/compose.sh config
```

---

## 4. Construir e iniciar

En el servidor:

```bash
sudo ./scripts/institutional/compose.sh up --build -d
```

Desde una estación con acceso directo al socket, y con `.env.institutional` ya creado:

```bash
pnpm docker:inst:up
```

---

## 5. Verificar estado

```bash
sudo ./scripts/institutional/compose.sh ps
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
sudo ./scripts/institutional/compose.sh logs -f --tail=200 auth-node
sudo ./scripts/institutional/compose.sh logs -f --tail=200 institutional-gateway
```

---

## 7. Reiniciar

```bash
sudo ./scripts/institutional/compose.sh restart
sudo ./scripts/institutional/compose.sh restart client-admin-next
```

---

## 8. Actualizar aplicaciones

```bash
git pull   # o el mecanismo de entrega institucional
sudo ./scripts/institutional/compose.sh up --build -d
# Solo frontends:
sudo ./scripts/institutional/compose.sh up --build -d client-admin-next institutional-gateway
```

Los volúmenes `inst_postgres18_data` e `inst_mongo_data` se conservan. Redis no tiene volumen.

---

## 9. Rollback

1. Conservar el commit/tag anterior del código.
2. `git checkout <tag-o-commit-anterior>`
3. `pnpm docker:inst:up` para reconstruir imágenes de ese punto.
4. Si un volumen quedó en mal estado, restaurar backup de `inst_postgres18_data` / `inst_mongo_data` (procedimiento de backup del servidor; fuera de este repo). Redis no se respalda.

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

| Script                  | Acción                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm docker:inst:up`   | `up --build -d` (socket local; en el servidor usar `sudo ./scripts/institutional/compose.sh`) |
| `pnpm docker:inst:down` | `down` (conserva volúmenes)                                                                   |
| `pnpm docker:inst:logs` | `logs -f`                                                                                     |
| `pnpm docker:inst:ps`   | `ps`                                                                                          |

---

## 12. Pendientes de verificar en el servidor

- [ ] Disponibilidad real de `33000` / `33001` (y del rango 33000–33049).
- [ ] Docker rootful operativo para `braulioecheverria` vía `sudo` (`sudo docker info`).
- [ ] Alcance DNS de `ks-ssr` / `ks-csr` y certificados.
- [ ] Conectividad a `mail.lab.kinal.edu.gt` / `KMH_PROJECT_API_KEY`.
- [ ] Credenciales Cloudinary de producción.
- [ ] Backup de `inst_postgres18_data` e `inst_mongo_data` (Redis no persiste).
- [ ] Prueba de login HTTPS con `SECURE_COOKIES=true` en ambos frontends.
- [ ] Que Hestia reenvíe `X-Forwarded-Proto: https`.

---

## 13. Archivos del stack institucional

| Archivo                                            | Rol                          |
| -------------------------------------------------- | ---------------------------- |
| `docker-compose.institutional.yml`                 | Orquestación                 |
| `.env.institutional.example`                       | Plantilla de variables       |
| `dockerfiles/mongo/institutional-init-app-user.js` | Usuario MongoDB `readWrite`  |
| `dockerfiles/Dockerfile.institutional-gateway`     | Build SPA + Nginx gateway    |
| `dockerfiles/nginx/institutional-gateway.conf`     | Proxy + estáticos + bloqueos |
| `scripts/institutional/compose.sh`                 | Wrapper compose              |
| `client-admin-next/src/app/api/health/route.ts`    | Health Next                  |
