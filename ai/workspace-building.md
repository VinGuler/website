# Workspace Building — Current State & Roadmap

## Current State (as of 2026-02-05)

### What's Done

**Monorepo foundation** — fully working:

- pnpm workspaces (`pnpm-workspace.yaml`) with `apps/*` and `packages/*`
- Turborepo pipeline: `build`, `dev`, `test`, `lint` — all tasks pass
- `packageManager`: `pnpm@10.5.2` (via corepack)
- Husky pre-commit (lint-staged + test) and pre-push (test) hooks
- Dockerfile (multi-stage, Node 22 Alpine, pnpm)
- ESLint flat config (v9) + Prettier + TypeScript strict mode
- ES modules throughout (`"type": "module"`)

**Existing apps** (`apps/`):

| App             | Type       | Stack                             | Status                   |
| --------------- | ---------- | --------------------------------- | ------------------------ |
| `landing-page`  | SPA        | Vue 3 + Vite + Pinia + Vue Router | Builds, 1 test passing   |
| `api-server`    | API        | Express v5 + tsx                  | Builds, 3 tests passing  |
| `client-server` | Full-stack | Express v5 + vanilla TS client    | Builds, 14 tests passing |

**Existing packages** (`packages/`):

| Package | Current Name     | Purpose                                |
| ------- | ---------------- | -------------------------------------- |
| `utils` | `@website/utils` | Shared utility functions (e.g., `log`) |

> **Action required:** Rename `@website/utils` → `@workspace/utils`. Update all imports and `package.json` references across the repo.

### What Doesn't Exist Yet

Comparing against `workspace-definition.md`:

#### 1. `ai/` Command Center structure

The `ai/` folder exists but is empty (just these docs). Needs:

- `ai/personas/` — AI identity prompts (e.g., `senior-backend-dev.md`, `vue-expert.md`)
- `ai/skills/` — Executable scripts: Exporter (flattening), Scaffolder (template generation)
- `ai/docs/` — Global coding standards, architectural constraints, shared rules

#### 2. `/templates` directory

No templates exist. Three tiers needed:

- **Tier 1 (Client only):** Vue 3 + Vite SPA — for landing pages, static tools
- **Tier 2 (Client + Server):** Vue 3 SPA + Express backend — for apps needing API/secrets
- **Tier 3 (Full-stack + DB):** Tier 2 + Prisma + Postgres — complete app unit

Templates should be "gold masters" that the Scaffolder skill copies and configures into `apps/`.

#### 3. `@workspace/database` package

No Prisma setup, no Postgres configuration, no shared database package. Needed for:

- Shared Prisma client in `packages/database`
- Per-app schemas (schemas live in each app's folder, not centralized)
- Migration tooling
- Turbo task for `prisma generate` that runs before dependent app builds

#### 4. Standalone Export tooling

No flattening/export mechanism. Needs:

- A skill that uses `pnpm deploy` to extract an app with its `@workspace/*` dependencies bundled
- Output: standalone repo with clean `package.json` (no `workspace:` protocol), fresh git history
- Include `docker-compose.yml` for local Postgres provisioning
- "Clone-and-run" ready for home assignments or independent repos

#### 5. Railway deployment

Not set up yet. Needed:

- Monorepo integration (Railway deploys multiple services from `/apps`)
- Subdomain routing via wildcard CNAME (`app-name.yourdomain.com`)
- Postgres provisioning in Railway's private network
- Auto SSL + edge-served static assets

## Suggested Build Order

Each step builds on the previous:

1. **Rename `@website` → `@workspace`** — align naming before more packages are added
2. **Create `ai/` subfolders** — `personas/`, `skills/`, `docs/` with initial content
3. **Build Tier 1 template** — simplest template, validates the scaffolding workflow
4. **Build Tier 2 template** — adds Express server layer
5. **Create `@workspace/database`** — Prisma + Postgres shared package
6. **Build Tier 3 template** — full-stack with DB, the most complete unit
7. **Build the Exporter skill** — `pnpm deploy` flattening + docker-compose generation
8. **Set up Railway deployment**

## Notes for the Implementing Agent

- Package scope is `@workspace` (not `@website`). All new packages go under this scope.
- The three apps in `apps/` are **examples**, not templates. Templates go in `/templates`.
- Prisma schemas are **per-app** (inside each app's folder), not centralized in the database package. The database package provides the shared client and base config.
- pnpm's strict `node_modules` means transitive types (like `@types/express-serve-static-core`) must be explicit devDependencies in each app that needs them.
- When adding Turborepo tasks (e.g., `prisma generate`, `db:migrate`), add them to `turbo.json` with correct `dependsOn` ordering.
