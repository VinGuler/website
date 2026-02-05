# Workspace Architecture & Documentation

## 1. The `ai/` Folder

The `ai/` directory is the "Command Center" of the workspace. It ensures that any AI agent has the context and tools required to maintain the factory independently.

- **`personas/`**: Contains Markdown files defining specific AI identities (e.g., `senior-backend-dev.md`, `vue-expert.md`). These serve as system prompts to set the expertise level for the agent.
- **`skills/`**: A library of executable scripts and command-line tools. Key examples include the **Exporter** (to flatten apps for standalone repos) and **Scaffolders** (to generate projects from templates).
- **`docs/`**: Global rules, coding standards, and architectural constraints. This ensures every app in the `/apps` directory follows the same DNA.

## 2. Monorepo Structure (pnpm + Turborepo)

The workspace utilizes a high-performance monorepo strategy to share logic while maintaining independent deployment lifecycles.

- **pnpm**: Manages the workspace via the `pnpm-workspace.yaml`. It uses a content-addressable store to share packages, ensuring that 10 apps using the same version of Vue only occupy the disk space of one. It enforces strict dependency boundaries.
- **Turborepo**: The orchestration layer.
  - **Caching**: Turbo hashes inputs to tasks; if code hasn't changed, it replays the `dist` or `build` folders from cache instantly.
  - **Task Graph**: It manages the pipeline (e.g., ensuring `prisma generate` in a package runs before an Express server in `/apps` starts).
- **`/packages`**: Internal shared libraries (e.g., `@workspace/database`, `@workspace/ui-shared`).
- **`/apps`**: Deployable project folders that consume the internal packages.

## 3. Template Tiers

Templates are "Gold Masters" located in `/templates`. They are designed for instant scaffolding with zero manual configuration.

- **Tier 1: Only Client**: A pure Vue 3 + Vite SPA. Optimized for landing pages or tools without a custom backend. Supports pre-rendering (SSG) for SEO.
- **Tier 2: Client + Server**: A Vue 3 SPA paired with a Node.js (Express) backend. Used for apps requiring API proxies, secret management, or server-side logic.
- **Tier 3: Full Stack (Client + Server + DB)**: The complete factory unit. Includes Tier 2 plus a connection to the shared `@workspace/database` package, pre-configured with Prisma schemas and migration paths.

## 4. Technical Stack

- **Frontend**: Vue 3 (Composition API) + Vite. Standardized as SPAs for high-speed delivery and simple static hosting.
- **Backend**: Node.js + Express. Focused on simplicity and fast middleware execution.
- **ORM/Database**: Prisma + Postgres. A shared Prisma client ensures all apps follow a consistent relational schema and type-safety.
- **Language**: TypeScript is used across the entire workspace to ensure end-to-end type safety from the DB to the UI.

## 5. Portability & Standalone Exports

The workspace is designed to produce "Home Assignments" or independent repositories from within the monorepo environment.

- **The "Flattening" Process**: Utilizing `pnpm deploy`, a skill extracts a specific app and physically bundles its internal `@workspace` dependencies into a standalone folder.
- **Assignment Readiness**: Exported repos are "clone-and-run." They feature their own `package.json` (free of workspace protocols), a fresh Git history, and a `docker-compose.yml` for instant local Postgres provisioning by third parties.

## 6. Railway Deployment

Railway is the unified hosting vendor for the entire factory.

- **Monorepo Integration**: Railway connects to the Workspace root and deploys multiple services from the `/apps` directory within a single project.
- **Subdomain Routing**: Configured via a wildcard CNAME. Apps are automatically served via `app-name.yourdomain.com`.
- **Infrastructure**: Database provisioning (Postgres) and environment variables are managed in the Railway dashboard. Servers and databases reside in the same private network for optimal latency.
- **SSL & Assets**: Railway handles SSL certificates automatically and serves Vue static assets via their global edge network.
