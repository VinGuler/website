# Finance Tracker — Implementation Plan (Summary)

## What We're Building

A manual finance cycle tracker scaffolded from `client-server-database` into `apps/finance-tracker`. Users register, add recurring income and payments, and track their monthly financial cycle. Workspaces can be shared with other users.

**Ports**: client 5180, server 3010
**Stack**: Vue 3 + Tailwind CSS v4 | Express 5 | PostgreSQL + Prisma 7 | JWT in httpOnly cookies

---

## 10 Steps

### 1. Scaffold from Template

Copy `templates/client-server-database/` → `apps/finance-tracker/`. Rename package, update ports, add new deps (`cookie-parser`, `jsonwebtoken`, `bcrypt`, `vue-router`, `@tailwindcss/vite`). Register in root `tsconfig.json`, `vitest.config.ts`, `package.json`, `eslint.config.js`.

### 2. Prisma Schema

5 models: `User`, `Workspace`, `WorkspaceUser` (composite PK), `Item`, `CompletedCycle`. Enums: `Permission` (OWNER/MEMBER/VIEWER), `ItemType` (INCOME/CREDIT_CARD/LOAN_PAYMENT/RENT/OTHER). Money as `Decimal(12,2)`.

### 3. Backend Infrastructure

Config (JWT secret, salt rounds), auth middleware (reads JWT cookie → `req.user`), error handler. Route files as factory functions `routerName(prisma)`.

### 4. Auth Routes

Register (creates User + Workspace + OWNER in transaction), login, logout, `/me` (session check + sliding expiry). Bcrypt hashing, httpOnly cookie.

### 5. Cycle Service

Pure functions: `calculateCycleDays(items)`, `calculateBalanceCards(balance, items)`, `buildCycleLabel()`. Transaction function: `archiveCycleIfNeeded()` with `SELECT FOR UPDATE` — archives completed cycle, resets `isPaid` flags.

### 6. Workspace + Items + Sharing Routes

- Workspace: GET (triggers auto-roll) + PUT balance
- Items: CRUD + togglePaid (adjusts balance)
- Sharing: search users by exact username, manage members with permission enforcement

### 7. Frontend Infrastructure

Tailwind v4 (Vite plugin), Vue Router (4 routes: login, register, workspace, shared), 3 Pinia stores (auth, workspace, sharing), typed API helper.

### 8. Frontend Views + Components

Login/Register forms, WorkspaceView (3 states: empty/active/between-cycles), BalanceCards (current/expected/deficit-excess), ItemList with paid toggles + overdue highlighting, ItemForm, sharing UI.

### 9. Sanity Tests

Backend: supertest for auth, workspace, items, sharing endpoints + unit tests for cycle logic. Frontend: basic render test.

### 10. Verification

Build, test, lint, dev server, manual smoke test of full flow.

---

## Key Decisions

| Decision                                 | Why                                              |
| ---------------------------------------- | ------------------------------------------------ |
| Factory function routers                 | Dependency injection for testability             |
| Cycle logic in service file              | Pure functions, testable independently           |
| `SELECT FOR UPDATE` for archiving        | Prevents duplicate archives in shared workspaces |
| Frontend duplicates balance calculations | Instant UI; server is source of truth on fetch   |
| Sliding JWT expiry (7d) on `/me`         | Simple, no refresh token for MVP                 |
| Single archive for multi-month gaps      | Balance is manually managed, items are recurring |

## Root Config Changes

- `tsconfig.json` — add reference
- `vitest.config.ts` — add project
- `package.json` — add scripts
- `eslint.config.js` — add to serverApps
