# AGENT.md

## 1. Monorepo Overview

The `workspace` monorepo is an app factory designed for rapidly building, testing, and deploying web applications from shared foundations. It leverages `pnpm` for efficient package management and `Turborepo` for task orchestration across workspaces. It's designed to be independently maintainable by AI agents.

### Structure

- `apps/`: Contains deployable applications, scaffolded from templates.
- `packages/`: Houses shared internal libraries (e.g., `@workspace/database`, `@workspace/utils`).
- `templates/`: Provides gold-master starting points for new applications (e.g., `api-server`, `client-server`, `client-server-database`, `landing-page`).
- `ai/`: Contains agent context (this file), personas, and the `WORKSPACE_MAP.md`.

### Key Technologies

- **Frontend**: Vue 3 (Composition API) + Vite.
- **Backend**: Node.js + Express.
- **Database/ORM**: PostgreSQL with Prisma.
- **Language**: TypeScript (end-to-end type safety).
- **Security**: AES-256-GCM + HMAC for encryption, password policy hardening.
- **Email**: Nodemailer for email services.
- **Tooling**: ESLint, Prettier, Vitest, Husky.
- **Package Manager**: pnpm.
- **Build System**: Turborepo.

### Core Principles

- **Context-Awareness**: Leverage documentation, project structure, and existing code patterns.
- **Proactive Problem Solving**: Anticipate issues, provide clear explanations.
- **Quality First**: Prioritize code quality, standards, and robust testing.
- **Transparency**: Clearly communicate actions, plans, and results.

## 2. Architectural Constraints

These constraints govern design and implementation within the monorepo.

### Monorepo Strategy

- **pnpm Workspaces**: Manages dependencies across `apps/*`, `packages/*`, and `templates/*`. Enforces strict dependency boundaries.
- **Turborepo**: Orchestrates `build`, `dev`, `test`, `lint` tasks with caching and task graph management (e.g., `prisma generate` runs before dependent app builds).

### Package Scope

- All internal shared packages must be scoped under `@workspace` (e.g., `@workspace/utils`).

### Application Structure

- **`/apps`**: For deployable application projects scaffolded from templates.
- **`/templates`**: Source of truth for new application structures ("Gold Master" templates).

### Database Management

- **Shared Prisma Client (`@workspace/database`)**: Dedicated package for a pre-configured Prisma Client instance and base configuration.
- **Per-App Prisma Schemas**: Each app has its own `schema.prisma` within its project directory (e.g., `apps/my-app/prisma/schema.prisma`). This allows isolated schema changes and migrations.
- **Migration Tooling**: Managed per-application using Prisma Migrate.

### Dependency Management

- **Strict `node_modules`**: Transitive dependencies (e.g., `@types/express-serve-static-core`) must be explicitly declared as `devDependencies` where directly used.

### Deployment Environment

- **Railway-First**: Designed for deployment on Railway (monorepo integration, auto-deployments, subdomain routing).
- **Containerization**: Production deployments leverage Docker.

### Security Considerations

- **Encryption**: AES-256-GCM with HMAC for encrypting sensitive user data (e.g., email addresses).
- **Password Policy**: Enforced password complexity (minimum 8 characters, mixed case, at least one digit).
- **Password Reset**: Secure, token-based email password reset flow to prevent unauthorized access.

## 3. Coding Standards

These standards ensure consistency, quality, and maintainability.

### Language

- **TypeScript**: All new code must be TypeScript, configured with strict mode.

### Formatting

- **Prettier**: Automatic code formatting via `.prettierrc` (root).
- **Pre-commit Hook**: Husky runs Prettier on staged files.

### Linting

- **ESLint**: Enforces code quality via `eslint.config.js` (root, flat config v9) with TypeScript and Vue rules.
- **Pre-commit Hook**: Husky runs ESLint checks.

### Module System

- **ES Modules**: The entire workspace uses ES modules (`"type": "module"`).

### Testing

- **Vitest**: Used for unit and integration testing.
- **Pre-push Hook**: Husky runs tests before pushing.

### Comments

- Explain _why_ code exists or is complex, not _what_ it does. Avoid redundancy.

## 4. Database Strategy: Prisma & PostgreSQL

### Core Principles

- **Type Safety**: End-to-end type safety with Prisma Client.
- **Consistency**: Shared Prisma client for standardized interactions.
- **Flexibility**: Per-application Prisma schemas for tailored models.

### Technology Stack

- **Database**: PostgreSQL
- **ORM**: Prisma (Client, Migrate, Studio)

### Shared Database Package (`@workspace/database`)

- Provides a pre-configured Prisma Client instance.
- Holds workspace-wide database configuration.

### Per-Application Prisma Schemas

- **Location**: `prisma/schema.prisma` within each app's directory.
- **Isolation**: Schema changes and migrations are app-specific.
- **Migration Management**: Managed per-application using Prisma Migrate.

### Environment Variables

- Database connection strings managed via environment variables (e.g., `DATABASE_URL`).
- Railway manages these; local dev uses `.env` files.

### Entity-Relationship Diagrams (ERDs)

- Update database documentation (e.g., this file or app-specific `database.md`) if schemas change significantly.
- Use Prisma Studio for visual exploration.

## 5. Agent Workflow

This outlines the expected workflow for AI agents managing tasks within the monorepo.

### Task Initialization

- **Load Task**: Expects a task definition at `ai/tasks/{task-name}_task.md`.
- **Initialize Progress**: Creates `ai/tasks/{task-name}_progress.md` for continuous logging.

### Understand the Request

- **Analyze**: Understand user request, scope, constraints.
- **Consult Documentation**: Refer to `AGENT.md` (this file) and `WORKSPACE_MAP.md`.
- **Inspect Codebase**: Use `list_directory`, `read_file`, `search_file_content`, `glob` on `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`.
- **Clarify**: Ask clarifying questions if ambiguous.

### Plan the Solution

- **Outline Steps**: Break tasks into subtasks; use `write_todos`.
- **Identify Tools**: Determine necessary tools (e.g., `write_file`, `replace`, `run_shell_command`).
- **Adhere to Conventions**: Align with coding standards and architecture.
- **Test Strategy**: Formulate a testing plan.

### Implement the Solution

- **Scaffolding**: Use templates from `/templates` into `/apps` if creating new apps.
- **Code Generation/Modification**: Follow coding standards.
- **Dependency Management**: Use `pnpm`.
- **Turborepo Configuration**: Update `turbo.json` for new tasks.
- **Atomic Changes**: Prefer small, focused changes.
- **Progress Tracking**: Regularly update `ai/tasks/{task-name}_progress.md`.

### Verify the Changes

- **Unit/Integration Tests**: Run `pnpm test` or `pnpm test:<project-name>`.
- **Build & Lint**: Execute `pnpm build`, `pnpm lint`, `tsc --noEmit`.
- **Review**: Self-review against request and plan.

### Finalize and Report

- **Confirm Completion**: Ensure all `write_todos` are `completed`.
- **Generate Summary**: Create `ai/tasks/{task-name}_summary.md`.
- **Clean Up**: Delete `ai/tasks/{task-name}_task.md` and `ai/tasks/{task-name}_progress.md`.
- **Await Next Instruction**: Inform user of completion.

### Sub-Agent Interaction

- Orchestrating agent spawns sub-agents with selected personas (from `ai/personas/`).
- Sub-agents utilize the same skills but apply them through their specialized persona's lens.

## 6. Skills Reference

AI agents can leverage the following operational workflows:

### Build

- **Purpose**: Compile and build all packages/applications using Turborepo.
- **Usage**:
  - `pnpm run build` (all projects)
  - `pnpm run build:template:<name>` (specific template)
  - `pnpm run build:<package-name>` (specific package, e.g., `build:utils`)
- **Notes**: Turborepo caches outputs. `tsc` for packages, Vite/tsx for apps.

### Database Management

- **Purpose**: Manage PostgreSQL databases and Prisma schemas.
- **Workflow**: Set up PostgreSQL (Docker), provision DBs, generate Prisma client, push schema, create/apply migrations, seed data, open Prisma Studio.
- **Usage Examples**:
  - `docker run ... postgres:16-alpine` (start PostgreSQL)
  - `pnpm run db:up` (start or create & start local PostgreSQL container)
  - `pnpm run db:down` (stop local PostgreSQL container)
  - `docker exec ... "CREATE DATABASE <app_db_name>;"`
  - `cd <app-dir> && npx prisma generate`
  - `cd <app-dir> && npx prisma migrate dev --name <migration-name>`
  - `cd <app-dir> && npx tsx prisma/seed.ts`
  - `cd <app-dir> && npx prisma studio`
- **Notes**: Per-app schemas; `@workspace/database` provides shared client.

### Dev (Local Development)

- **Purpose**: Launch applications/templates in dev mode with hot-reloading.
- **Usage**:
  - `pnpm run dev` (all projects)
  - `pnpm run dev:templates` (all templates)
  - `pnpm run dev:template:<name>` (specific template, e.g., `dev:template:api-server`)
- **Notes**: Persistent tasks (`"cache": false`, `"persistent": true` in `turbo.json`). Requires PostgreSQL for database-dependent apps.

### Exporter

- **Purpose**: "Flatten" an app into a standalone repository (e.g., for home assignments).
- **How it Works**: Uses `pnpm deploy` or similar to copy app, bundle `@workspace` deps, create clean `package.json` (replacing `workspace:` protocols), fresh Git history, and `docker-compose.yml` for local Postgres.
- **Inputs**: `appName` (e.g., `client-server-database`), `outputPath` (optional).

### Lint & Format

- **Purpose**: Enforce code quality (ESLint) and consistent formatting (Prettier).
- **Usage**:
  - `pnpm run lint` / `pnpm run lint:fix`
  - `pnpm run format` / `pnpm run format:check`
- **Notes**: ESLint (v9 flat config), Prettier. Integrated with Husky pre-commit hooks.

### Scaffolder

- **Purpose**: Automates creating new apps in `/apps` from `/templates`.
- **Workflow**: Select template, copy files, update `package.json` (rename, update deps, add scripts), update workspace configs (e.g., `pnpm-workspace.yaml`), `pnpm install`, `pnpm run build:<new-app>`.
- **Inputs**: `templateName`, `appName`.

### Testing

- **Purpose**: Run unit and integration tests using Vitest.
- **Usage**:
  - `pnpm run test` (all tests, database container is automatically managed)
  - `pnpm run test:<project-name>` (specific project, database container is automatically managed)
  - `pnpm run test:coverage` (with coverage, database container is automatically managed)
- **Notes**: Vitest for unit/integration; Playwright for E2E (conceptual). Husky pre-push hook integration.

### Smart Commit & Push

- **Workflow**: Use Conventional Commits (e.g., `feat:`, `fix:`).
- **Rule**: Summarize commit message based on the **Chat Context** only.
- **Constraint**: DO NOT read physical files to generate the message.
- **Action**: `git add .`, `git commit -m "..."`, and `git push`.

## 7. Persona Index

Personas define specialized AI identities for sub-agents, focusing their expertise (e.g., full-stack developer, QA engineer). They are located in `ai/personas/`.

## 8. Deployment Notes (Railway)

- All apps are deployed to Railway.
- Railway deploys multiple services from `/apps` within a single project.
- Subdomain routing: `https://<app-name>.yourdomain.com`.
- Railway manages DB provisioning (Postgres) and environment variables.
- For detailed configuration, advanced troubleshooting, and monorepo-specific setup, refer to the [Railway Advanced Deployment Guide](RAILWAY_ADVANCED_DEPLOYMENT.md).
