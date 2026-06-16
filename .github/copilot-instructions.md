# Copilot Workspace Instructions for KinalSports Monorepo

Welcome to the KinalSports monorepo. This guide provides essential instructions for AI agents (like GitHub Copilot) to be productive and follow project conventions.

---

## Monorepo Structure and Key Components

- **authentication-service/auth-node**: Node.js auth API (PostgreSQL) — stack movil/usuario
- **authentication-service/auth-service**: .NET 8 auth API (PostgreSQL, Clean Architecture) — stack admin
- **server-admin**: Node.js admin management API (MongoDB)
- **server-user**: Node.js user-facing API (MongoDB)
- **client-admin**: React + Vite web admin frontend
- **client-user**: React Native (Expo) mobile app for users

See [README.md](../README.md) for architecture diagrams and port map.

### Auth split (important)

| Consumer     | Auth service         | Business API         |
| ------------ | -------------------- | -------------------- |
| client-admin | auth-service (:5156) | server-admin (:3009) |
| client-user  | auth-node (:3007)    | server-user (:3008)  |

Do not point client-admin at auth-node or client-user at auth-service unless explicitly migrating.

---

## Build and Run Commands

- **Install all dependencies:**

  ```bash
  pnpm install
  ```

- **Docker (full stack):**

  ```bash
  docker compose up --build
  ```

- **Start services individually (local dev):**

  ```bash
  pnpm --filter auth-service dev      # .NET auth (admin) :5156
  pnpm --filter auth-node dev         # Node auth (mobile) :3007
  pnpm --filter server-admin dev      # Admin API :3009
  pnpm --filter server-user dev       # User API :3008
  pnpm --filter client-admin dev      # Admin frontend :5173
  pnpm --filter client-user start     # Expo mobile :8081
  ```

- **Build .NET service:**

  ```bash
  pnpm --filter auth-service build
  ```

- **Run tests:**
  ```bash
  pnpm -r run test
  pnpm --filter auth-node test
  pnpm --filter auth-service test
  ```

---

## Default Ports (Docker)

| Service      | Port  |
| ------------ | ----- |
| auth-service | 5156  |
| auth-node    | 3007  |
| server-admin | 3009  |
| server-user  | 3008  |
| client-admin | 5173  |
| client-user  | 8081  |
| postgres     | 5435  |
| mongodb      | 27020 |

---

## Linting and Formatting

```bash
pnpm lint
pnpm format
pnpm --filter <service> lint:fix
```

Note: root `lint` covers server-\*, auth-node and client-admin but not client-user.

---

## Commit Conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Example: `feat(server-admin): add tournament CRUD endpoints`
- Default branch: `master`
- See [README.md](../README.md) for details

---

## Project-Specific Conventions

- **.env files:** Each service has its own `.env.example`. client-admin uses `VITE_*` vars; client-user uses `EXPO_PUBLIC_*`.
- **API prefixes:**
  - auth-\*: `/api/v1`
  - server-admin: `/kinalSportsAdmin/v1`
  - server-user: `/kinalSportsUser/v1`
- **auth-service (.NET):** Clean Architecture. Recreation guides: [GUIA_RAPIDA.md](../authentication-service/auth-service/GUIA_RAPIDA.md), [FLUJO_RECREACION_PASO_A_PASO.md](../authentication-service/auth-service/FLUJO_RECREACION_PASO_A_PASO.md)
- **pnpm workspaces:** Use `pnpm --filter <package-name>` for scripts. `client-user` is in `pnpm-workspace.yaml`.

---

## Documentation Links

- [Monorepo README](../README.md)
- [Auth Node](../authentication-service/auth-node/README.md)
- [Auth Service (.NET)](../authentication-service/auth-service/README.md)
- [Server Admin](../server-admin/README.md)
- [Server User](../server-user/README.md)
- [Client Admin](../client-admin/README.md)
- [Client User](../client-user/README.md)

---

## Example Prompts

- "How do I run all services with Docker?"
- "Which auth service does client-user use?"
- "Show me the commit message format."
- "How do I recreate the .NET AuthService from scratch?"
- "Where do I configure environment variables for each service?"

---

## Link, Don't Duplicate

For detailed guides, link to the relevant README instead of duplicating content here.

---

For any unclear conventions, consult the relevant README or ask for clarification.
