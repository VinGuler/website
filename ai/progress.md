# Migration Progress: npm workspaces → Turborepo

## Milestones

### 1. Folder Restructure

- **Status:** Complete
- Moved `packages/client-example` → `apps/client-example`
- Moved `packages/server-example` → `apps/server-example`
- Moved `packages/full-stack-example` → `apps/full-stack-example`
- Created `packages/` for shared code

### 2. Create Shared Utils Package

- **Status:** Complete
- Created `packages/utils` (`@website/utils`) with `log()` function
- Package exports via ES modules with TypeScript declarations
- Imported into all 3 apps as POC

### 3. Turborepo Integration

- **Status:** Complete
- Installed `turbo` v2.8.3 as root devDependency
- Created `turbo.json` with task pipeline:
  - `build` — depends on `^build`, caches `dist/**`
  - `dev` — persistent, no cache
  - `test` — depends on `^build`, no cache
  - `lint` — depends on `^build`
- Added `packageManager` field to root `package.json`
- Added `.turbo` to `.gitignore`

### 4. Config Updates

- **Status:** Complete
- Root `package.json`: Updated workspaces to `["apps/*", "packages/*"]`, scripts use `turbo` for build/dev/lint
- Root `tsconfig.json`: References updated from `packages/*` → `apps/*` + `packages/utils`
- `vitest.config.ts`: Projects updated to `apps/*` paths with inline vue plugin for client-example
- Removed `vitest.workspace.ts` (consolidated into `vitest.config.ts`)
- `Dockerfile`: Updated COPY paths from `packages/` → `apps/`, uses `npx turbo build`
- `apps/client-example/vite.config.ts`: Fixed outDir from `../server/` → `../server-example/`
- `apps/full-stack-example/tsconfig.json`: Fixed moduleResolution for bundler compatibility
- `apps/client-example/vitest.config.ts`: Made self-contained with vue plugin
- All app `package.json` files: Added `lint` script, added `@website/utils` dependency
- `CLAUDE.md`: Updated to reflect new architecture

### 5. Verification

- **Status:** Complete
- `turbo build` — 4/4 packages build successfully
- `vitest run` — 18/18 tests pass across 4 test files
- `turbo lint` — All apps + packages lint successfully
- Per-app filtering works: `turbo build --filter=server-example`, `vitest --project client-example`
- Turbo caching verified: subsequent builds show `FULL TURBO` (cache hit)
