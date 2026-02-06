# Workspace Building — Current State & Roadmap

## Current State (as of 2026-02-06)

### What's Done

**Monorepo foundation** — fully working:

- pnpm workspaces (`pnpm-workspace.yaml`) with `apps/*`, `packages/*`, and `templates/*`
- Turborepo pipeline: `build`, `dev`, `test`, `lint` — all tasks pass
- `packageManager`: `pnpm@10.5.2` (via corepack)
- Husky pre-commit (lint-staged + test) and pre-push (test) hooks
- Dockerfile (multi-stage, Node 22 Alpine, pnpm)
- ESLint flat config (v9) + Prettier + TypeScript strict mode
- ES modules throughout (`"type": "module"`)
- Package scope: `@workspace` (rename from `@website` complete)

**`apps/`** — empty (`.gitkeep` only). New apps are scaffolded from templates into this directory.

**Templates** (`templates/`):

| Template                 | Type            | Stack                               | Status                   |
| ------------------------ | --------------- | ----------------------------------- | ------------------------ |
| `landing-page`           | Client only     | Vue 3 + Vite + Pinia + Vue Router   | Builds, 1 test passing   |
| `api-server`             | Server only     | Express v5 + tsx (minimal UI)       | Builds, 3 tests passing  |
| `client-server`          | Client + Server | Express v5 + vanilla TS client      | Builds, 14 tests passing |
| `client-server-database` | Full Stack + DB | Client + Server + Prisma + Postgres | Builds                   |

**Existing packages** (`packages/`):

| Package | Name               | Purpose                                |
| ------- | ------------------ | -------------------------------------- |
| `utils` | `@workspace/utils` | Shared utility functions (e.g., `log`) |

### What Doesn't Exist Yet

Comparing against `workspace-definition.md`:

#### 1. `ai/` Command Center structure

The `ai/` folder exists but only contains planning docs. Needs:

- `ai/personas/` — AI identity prompts (e.g., `senior-backend-dev.md`, `vue-expert.md`)
- `ai/skills/` — Executable scripts: Exporter (flattening), Scaffolder (template generation)
- `ai/docs/` — Global coding standards, architectural constraints, shared rules

#### 2. `@workspace/database` package

No Prisma setup, no Postgres configuration, no shared database package. Needed for:

- Shared Prisma client in `packages/database`
- Per-app schemas (schemas live in each app's folder, not centralized)
- Migration tooling
- Turbo task for `prisma generate` that runs before dependent app builds

#### 3. Standalone Export tooling

No flattening/export mechanism. Needs:

- A skill that uses `pnpm deploy` to extract an app with its `@workspace/*` dependencies bundled
- Output: standalone repo with clean `package.json` (no `workspace:` protocol), fresh git history
- Include `docker-compose.yml` for local Postgres provisioning
- "Clone-and-run" ready for home assignments or independent repos

## Suggested Build Order

Remaining steps (1–4 already completed):

1. ~~**Rename `@website` → `@workspace`**~~ — done
2. **Create `ai/` subfolders** — `personas/`, `skills/`, `docs/` with initial content
3. ~~**Build templates**~~ — done (all 4: `landing-page`, `api-server`, `client-server`, `client-server-database`)
4. **Create `@workspace/database`** — Prisma + Postgres shared package (will be built alongside `ai/` setup)
5. **Build the Exporter skill** — `pnpm deploy` flattening + docker-compose generation

> **Railway deployment** requires no workspace-level setup — Railway deploys on push automatically.

## Notes for the Implementing Agent

- Package scope is `@workspace`. All new packages go under this scope.
- `apps/` is for scaffolded projects, not templates. Templates live in `/templates`.
- Prisma schemas are **per-app** (inside each app's folder), not centralized in the database package. The database package provides the shared client and base config.
- pnpm's strict `node_modules` means transitive types (like `@types/express-serve-static-core`) must be explicit devDependencies in each app that needs them.
- When adding Turborepo tasks (e.g., `prisma generate`, `db:migrate`), add them to `turbo.json` with correct `dependsOn` ordering.
