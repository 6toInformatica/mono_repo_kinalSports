# Copilot Workspace Instructions for KinalSports Monorepo

Welcome to the KinalSports monorepo! This guide provides essential instructions for AI agents (like GitHub Copilot) to be productive and follow project conventions.

---

## Monorepo Structure & Key Components

- **authentication-service/auth-node**: Node.js API for authentication (PostgreSQL)
- **authentication-service/auth-service**: .NET API for authentication (PostgreSQL, Clean Architecture)
- **server-admin**: Node.js API for admin management (MongoDB)
- **server-user**: Node.js API for user-facing endpoints (MongoDB)
- **client-admin**: React + Vite web admin frontend
- **client-user**: React Native (Expo) mobile app for users

See [README.md](../README.md) for architecture diagrams and more details.

---

## Build & Run Commands

- **Install all dependencies:**
  ```bash
  pnpm install
  ```
- **Start all main services (in separate terminals):**
  ```bash
  pnpm --filter auth-node dev         # Auth Node (Node.js)
  pnpm --filter server-admin dev      # Admin API
  pnpm --filter server-user dev       # User API
  pnpm --filter client-admin dev      # Admin Frontend
  pnpm --filter auth-service dev      # Auth Service (.NET)
  ```
- **Build .NET service:**
  ```bash
  pnpm --filter auth-service build
  # or
  dotnet build
  ```
- **Run tests:**
  ```bash
  pnpm -r run test
  # or for a specific service
  pnpm --filter auth-node test
  pnpm --filter auth-service test
  ```

---

## Linting & Formatting

- **Lint all:**
  ```bash
  pnpm lint
  ```
- **Format all:**
  ```bash
  pnpm format
  ```
- **Fix lint issues:**
  ```bash
  pnpm --filter <service> lint:fix
  ```

---

## Commit Conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Example: `feat(server-admin): add tournament CRUD endpoints`
- See [README.md](../README.md#commit-conventions) for details

---

## Project-Specific Conventions & Pitfalls

- **.env files:** Each service manages its own environment variables. See each service's README for details.
- **client-admin:** Does not use .env by default; endpoints are hardcoded unless configured.
- **auth-service (.NET):** Follows Clean Architecture. See [FLUJO_RECREACION_PASO_A_PASO.md](../authentication-service/auth-service/FLUJO_RECREACION_PASO_A_PASO.md) for step-by-step recreation.
- **auth-node, server-admin, server-user:** Use Node.js, Express, and either MongoDB or PostgreSQL. See respective READMEs for API and DB setup.
- **pnpm workspaces:** Use `pnpm` for all dependency management and scripts.

---

## Documentation Links

- [Monorepo README](../README.md)
- [Auth Node (Node.js)](../authentication-service/auth-node/README.md)
- [Auth Service (.NET)](../authentication-service/auth-service/README.md)
- [Server Admin](../server-admin/README.md)
- [Server User](../server-user/README.md)
- [Client Admin](../client-admin/README.md)

---

## Example Prompts

- "How do I run all services for local development?"
- "Show me the commit message format."
- "How do I recreate the .NET AuthService from scratch?"
- "Where do I configure environment variables for each service?"
- "How do I run tests for all services?"

---

## Link, Don't Duplicate

- For detailed guides, always link to the relevant README or documentation file instead of duplicating content here.

---

## Next Steps: Agent Customizations

- Consider creating applyTo-based instructions for:
  - Frontend (client-admin, client-user)
  - Backend (server-admin, server-user, authentication-service)
  - .NET-specific workflows (auth-service)
- Example: `/create-instruction applyTo:auth-service ...` to enforce .NET conventions only for that service.

---

For any unclear or missing conventions, consult the relevant README or ask for clarification.
