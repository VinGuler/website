# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Test, and Lint Commands

```bash
# Install dependencies
npm install

# Development (via Turborepo)
npm run dev                         # Run all apps in dev mode
npm run dev:client-example          # Vite dev server (port 5173)
npm run dev:server-example          # Express with hot-reload (port 3000)
npm run dev:full-stack-example      # Full-stack example dev mode
npm run dev:client-server-example   # Run client + server examples together
npm run deployer:dev                # Deployer app dev mode

# Build (via Turborepo)
npm run build                       # Build all apps + packages
npm run build:client-example        # Build client-example only
npm run build:server-example        # Build server-example only
npm run build:full-stack-example    # Build full-stack-example only
npm run build:utils                 # Build @website/utils only
npm run deployer                    # Build and start deployer app

# Testing (Vitest)
npm run test                        # Run all tests (watch mode)
vitest run                          # Run all tests once
vitest --project client-example     # Run tests for a single app
vitest run path/to/test.spec.ts     # Run a single test file

# Linting & Formatting (via Turborepo)
npm run lint                        # ESLint check (all apps + packages)
npm run lint:fix                    # ESLint auto-fix
npm run format                      # Prettier format all files
npm run format:check                # Prettier check without writing
```

## Architecture

This is a **Turborepo monorepo using npm workspaces** with ES modules throughout (`"type": "module"`). TypeScript strict mode is enabled.

### Apps (`apps/`)

Deployable applications registered as npm workspaces:

- **client-example** — Vue 3 + Vite SPA using Composition API, Pinia state management, Vue Router. Tests run with jsdom environment.
- **server-example** — Express.js v5 REST API. Tests use Supertest for HTTP assertions. Uses tsx for dev hot-reload.
- **full-stack-example** — Todo CRUD app with Express backend + vanilla TypeScript client (no framework). Express serves the static client files.

### Packages (`packages/`)

Shared libraries and utilities consumed by apps:

- **@website/utils** — Shared utility functions (e.g., `log`). Built with TypeScript, exports via ES modules.

### Deployer App (`deployer/app/`)

A standalone Vercel deployment automation tool (not part of npm workspaces). Has its own `package.json`, `node_modules`, and build process.

**Service pipeline:** Scanner → Analyzer → Executor → VercelService

- **ScannerService** (`src/services/scanner.ts`) — Discovers Node.js projects by finding `package.json` files
- **AnalyzerService** (`src/services/analyzer.ts`) — Detects project type (frontend/backend/fullstack), framework, build tool, database, and env vars
- **VercelService** (`src/services/vercel.ts`) — Vercel API client for project creation, deployment, domain management, and env vars
- **ExecutorService** (`src/services/executor.ts`) — Orchestrates the deployment workflow
- **DataService** (`src/services/data.ts`) — JSON file persistence (`data/projects.json`, `data/deployments.json`)

**Frontend:** Plain HTML/CSS/TypeScript in `src/client/` — no framework.

**API routes** defined in `src/server/routes.ts`, server entry in `src/server/index.ts`.

**Requires `.env`** with `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_DOMAIN`.

### AI Feature Specs (`ai/features/`)

Design documents and feature requests (markdown). Not executable code.

## Key Configuration

- **Turborepo** (`turbo.json`): Task pipeline for `build`, `dev`, `test`, `lint`. Build tasks depend on upstream package builds (`^build`). Dev tasks are persistent and uncached.
- **Vitest** (`vitest.config.ts`): Defines test projects — client-example uses jsdom + vue plugin; server-example and full-stack-example use their own vitest configs
- **ESLint** (`eslint.config.js`): Flat config (v9+) with TypeScript + Vue + Prettier integration. `no-explicit-any` is off; unused vars warn only if not prefixed with `_`
- **Prettier** (`.prettierrc`): 100 char width, 2-space indent, single quotes, ES5 trailing commas
- **Husky + lint-staged**: Pre-commit hooks run Prettier and ESLint on staged `*.{js,ts,vue}` files
- **Docker**: Multi-stage build targeting Node 22 Alpine
