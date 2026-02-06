# Architectural Constraints

This document details the architectural decisions and constraints governing the design and implementation of applications and packages within the `workspace` monorepo.

## Monorepo Strategy

- **pnpm Workspaces**: The monorepo is managed using `pnpm` workspaces (`pnpm-workspace.yaml`), allowing for efficient dependency management and package sharing across `apps/*`, `packages/*`, and `templates/*`.
- **Turborepo**: Build and task orchestration is handled by Turborepo.
  - **Caching**: Leverages Turborepo's caching mechanisms for `build`, `dev`, `test`, `lint` tasks to speed up development by skipping redundant computations.
  - **Task Graph**: Tasks are defined in `turbo.json` with explicit `dependsOn` relationships to ensure correct execution order (e.g., `prisma generate` running before dependent app builds).

## Package Scope

- All internal shared packages must be scoped under `@workspace` (e.g., `@workspace/utils`, `@workspace/database`). New packages should adhere to this naming convention.

## Application Structure

- **`/apps`**: Intended solely for deployable application projects scaffolded from templates. Direct development of applications outside of the templating process should be avoided.
- **`/templates`**: The source of truth for new application structures. All new applications should be generated from these "Gold Master" templates.

## Database Management

- **Shared Prisma Client (`@workspace/database`)**: A dedicated package (`@workspace/database`) is responsible for providing a shared Prisma client and base database configuration.
- **Per-App Prisma Schemas**: While the client is shared, Prisma schemas (`schema.prisma`) are located **within each application's folder** (e.g., `apps/my-app/prisma/schema.prisma`). This allows for app-specific database models and migration paths.
- **Migration Tooling**: Applications are expected to manage their own database migrations through their respective Prisma setups.

## Dependency Management

- **Strict `node_modules`**: Due to pnpm's strict nature, transitive dependencies (e.g., `@types/express-serve-static-core`) must be explicitly declared as `devDependencies` in each package or application that directly uses them. This prevents reliance on hoisted dependencies.

## Deployment Environment

- **Railway-First**: The architecture assumes Railway as the primary deployment platform. Applications and services should be designed to be compatible with Railway's monorepo deployment capabilities.
- **Containerization**: While not strictly enforced for development, production deployments may leverage Docker (as indicated by the root `Dockerfile`) for consistent environments.
