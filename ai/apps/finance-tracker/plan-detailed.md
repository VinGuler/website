# Finance Tracker — Detailed Implementation Plan (Agent Reference)

## Context

This document is the full implementation reference for building the Finance Tracker app. It is scaffolded from the existing `client-server-database` template into `apps/finance-tracker/` within a pnpm + Turborepo monorepo.

**User decisions:**

- Cycle wraps across calendar months (income on 25th, last payment on 15th → cycle is 25th–16th of next month)
- Item types: `income` (money in), `credit-card`, `loan-payment`, `rent`, `other` (money out)
- Tailwind CSS v4 for styling (Vite plugin, CSS-first config)
- JWT in httpOnly cookies for auth
- Ports: client 5180, server 3010

**Read `request.md` in this same directory for the full product requirements.**

---

## Step 1: Scaffold from Template

### 1.1 Copy Template

Copy all files from `templates/client-server-database/` to `apps/finance-tracker/`. Then remove template-specific content (the Todo model, todo store, todo-related App.vue code).

### 1.2 Update `apps/finance-tracker/package.json`

```json
{
  "name": "finance-tracker",
  "description": "Manual finance cycle tracker",
  "type": "module",
  "private": true
}
```

**Add production dependencies:**

- `cookie-parser` — parse httpOnly JWT cookies
- `jsonwebtoken` — sign/verify JWTs
- `bcrypt` — password hashing
- `vue-router` — client-side routing

**Add devDependencies:**

- `@types/cookie-parser`
- `@types/jsonwebtoken`
- `@types/bcrypt`
- `@tailwindcss/vite` — Tailwind CSS v4 Vite plugin

**Keep existing:** `@prisma/client`, `@workspace/database`, `@workspace/utils`, `dotenv`, `express`, `pinia`, `vue`, and all existing devDeps (vitest, supertest, @vue/test-utils, jsdom, vite, tsx, typescript, @vitejs/plugin-vue, prisma, @types/\*, npm-run-all2).

### 1.3 Update Ports and Names

**`apps/finance-tracker/vite.config.ts`:**

```typescript
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools()],
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/client', import.meta.url)),
    },
  },
  server: {
    port: 5180,
    proxy: {
      '/api': 'http://localhost:3010',
    },
  },
});
```

**`apps/finance-tracker/.env`:**

```
DATABASE_URL=postgresql://workspace:workspace_dev@localhost:5432/finance_tracker_db
JWT_SECRET=finance-tracker-dev-secret-change-in-production
```

**`apps/finance-tracker/.env.example`:**

```
DATABASE_URL=postgresql://user:password@localhost:5432/finance_tracker_db
JWT_SECRET=your-jwt-secret-here
```

**`apps/finance-tracker/vitest.config.ts`:** Change `name` to `'finance-tracker'`.

**`apps/finance-tracker/src/client/index.html`:** Change `<title>` to `Finance Tracker`.

### 1.4 Register in Root Configs

**`/tsconfig.json`** — add to `references` array:

```json
{ "path": "./apps/finance-tracker" }
```

**`/vitest.config.ts`** — add to `test.projects` array:

```typescript
'apps/finance-tracker/vitest.config.ts',
```

**`/package.json`** — add to `scripts`:

```json
"dev:app:finance-tracker": "turbo dev --filter=finance-tracker",
"test:finance-tracker": "./change-db-state.sh --up && vitest --run --project finance-tracker && ./change-db-state.sh --down || ./change-db-state.sh --down"
```

**`/eslint.config.js`** — add to `serverApps` array:

```typescript
const serverApps = [
  'templates/api-server/**/*.ts',
  'packages/database/**/*.ts',
  'apps/finance-tracker/src/server/**/*.ts', // ADD THIS
];
```

### 1.5 Verify

Run `pnpm install && pnpm build --filter=finance-tracker` to confirm scaffold works.

---

## Step 2: Prisma Schema + Migration

### 2.1 Schema

**File: `apps/finance-tracker/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Permission {
  OWNER
  MEMBER
  VIEWER
}

enum ItemType {
  INCOME
  CREDIT_CARD
  LOAN_PAYMENT
  RENT
  OTHER
}

model User {
  id           Int             @id @default(autoincrement())
  username     String          @unique
  displayName  String          @map("display_name")
  passwordHash String          @map("password_hash")
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")
  workspaces   WorkspaceUser[]

  @@map("users")
}

model Workspace {
  id              Int              @id @default(autoincrement())
  balance         Decimal          @default(0) @db.Decimal(12, 2)
  cycleStartDay   Int?             @map("cycle_start_day")
  cycleEndDay     Int?             @map("cycle_end_day")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  users           WorkspaceUser[]
  items           Item[]
  completedCycles CompletedCycle[]

  @@map("workspaces")
}

model WorkspaceUser {
  userId      Int        @map("user_id")
  workspaceId Int        @map("workspace_id")
  permission  Permission @default(VIEWER)
  createdAt   DateTime   @default(now()) @map("created_at")
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@id([userId, workspaceId])
  @@map("workspace_users")
}

model Item {
  id          Int       @id @default(autoincrement())
  workspaceId Int       @map("workspace_id")
  type        ItemType
  label       String
  amount      Decimal   @db.Decimal(12, 2)
  dayOfMonth  Int       @map("day_of_month")
  isPaid      Boolean   @default(false) @map("is_paid")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("items")
}

model CompletedCycle {
  id            Int       @id @default(autoincrement())
  workspaceId   Int       @map("workspace_id")
  cycleLabel    String    @map("cycle_label")
  finalBalance  Decimal   @map("final_balance") @db.Decimal(12, 2)
  itemsSnapshot Json      @map("items_snapshot")
  createdAt     DateTime  @default(now()) @map("created_at")
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("completed_cycles")
}
```

**Design notes:**

- `Decimal(12,2)` for all money fields — avoids floating point, supports up to 9,999,999,999.99
- `cycleStartDay`/`cycleEndDay` are nullable — null when workspace has no items (empty state)
- `WorkspaceUser` uses composite PK `[userId, workspaceId]`
- All `@@map` for snake_case table names, all `@map` for snake_case column names (matches template pattern)
- `onDelete: Cascade` — deleting workspace removes items, members, cycles
- `dayOfMonth` validated at app layer (1-31)
- `itemsSnapshot` is `Json` type (JSONB in Postgres)

### 2.2 Migration

```bash
cd apps/finance-tracker
npx prisma migrate dev --name init
```

### 2.3 Seed File

**File: `apps/finance-tracker/prisma/seed.ts`**

Create a demo user (`demo` / `password123`) with:

- A workspace (balance 5000)
- 3 items: Income on 10th (8000), Rent on 1st (3000), Credit Card on 15th (2000)
- Password hashed with bcrypt

---

## Step 3: Backend — Config, Middleware, Types

### 3.1 Server Directory Structure

```
apps/finance-tracker/src/server/
  index.ts                    — Express app setup, middleware, route mounting, exports
  config.ts                   — Constants
  middleware/
    auth.ts                   — JWT verification middleware
    error.ts                  — Global error handler
  routes/
    auth.ts                   — POST register, POST login, POST logout, GET me
    workspace.ts              — GET workspace, PUT balance
    items.ts                  — POST, PUT, DELETE items
    sharing.ts                — GET search, GET shared, GET/POST/DELETE members
  services/
    cycle.ts                  — Cycle calculation, archiving
  types.ts                    — Shared TypeScript interfaces
```

### 3.2 Config

**File: `apps/finance-tracker/src/server/config.ts`**

```typescript
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);
export const TOKEN_EXPIRY = '7d';
export const COOKIE_NAME = 'ft_token';
```

### 3.3 Auth Middleware

**File: `apps/finance-tracker/src/server/middleware/auth.ts`**

- Read JWT from `req.cookies[COOKIE_NAME]`
- Verify with `jsonwebtoken.verify(token, JWT_SECRET)`
- Attach `req.user = { id: number, username: string }` to request
- Return 401 `{ success: false, error: 'Not authenticated' }` if missing/invalid

**Express Request type augmentation:**

```typescript
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number; username: string };
  }
}
```

Export as `requireAuth` middleware function.

### 3.4 Error Handler

**File: `apps/finance-tracker/src/server/middleware/error.ts`**

Standard Express error handler:

```typescript
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
}
```

### 3.5 Server Entry Point

**File: `apps/finance-tracker/src/server/index.ts`**

Follow the exact pattern from `templates/client-server-database/src/server/index.ts`:

```typescript
import 'dotenv/config';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '@workspace/utils';
import { getDatabaseUrl, createClient, checkHealth } from '@workspace/database';
import { authRouter } from './routes/auth.js';
import { workspaceRouter } from './routes/workspace.js';
import { itemsRouter } from './routes/items.js';
import { sharingRouter } from './routes/sharing.js';
import { errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3010;

const DB_NAME = 'finance_tracker_db';
const databaseUrl = process.env.DATABASE_URL ?? getDatabaseUrl(DB_NAME);
const prisma = createClient(databaseUrl);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', async (_req, res) => {
  const healthy = await checkHealth(prisma);
  res.status(healthy ? 200 : 503).json({ success: healthy, status: healthy ? 'ok' : 'unhealthy' });
});

// Routes (factory pattern — each receives prisma instance)
app.use('/api/auth', authRouter(prisma));
app.use('/api/workspace', workspaceRouter(prisma));
app.use('/api/items', itemsRouter(prisma));
app.use('/api', sharingRouter(prisma));

// Static & SPA fallback (production)
const clientPath = join(__dirname, '..', '..', 'dist', 'client');
app.use(express.static(clientPath));
app.get('{*path}', (_req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

app.use(errorHandler);

export { app, prisma };

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    log('info', 'finance-tracker', `Server running on http://localhost:${PORT}`);
  });
}
```

### 3.6 Types

**File: `apps/finance-tracker/src/server/types.ts`**

```typescript
export interface JwtPayload {
  id: number;
  username: string;
}

export interface BalanceCards {
  currentBalance: number;
  expectedBalance: number;
  deficitExcess: number;
}

export interface WorkspaceResponse {
  workspace: {
    id: number;
    balance: number;
    cycleStartDay: number | null;
    cycleEndDay: number | null;
  };
  items: Array<{
    id: number;
    type: string;
    label: string;
    amount: number;
    dayOfMonth: number;
    isPaid: boolean;
  }>;
  balanceCards: BalanceCards;
  cycleLabel: string | null;
  permission: string;
}
```

---

## Step 4: Auth Routes

**File: `apps/finance-tracker/src/server/routes/auth.ts`**

Export factory function `authRouter(prisma: PrismaClient): Router`.

### POST /api/auth/register

**Body:** `{ username: string, displayName: string, password: string }`

**Validation:**

- `username`: 3-30 chars, alphanumeric + underscore only (`/^[a-zA-Z0-9_]{3,30}$/`)
- `displayName`: 1-50 chars, trimmed
- `password`: 6+ chars

**Logic (in a Prisma transaction):**

1. Hash password with `bcrypt.hash(password, SALT_ROUNDS)`
2. Create `User` with `{ username, displayName, passwordHash }`
3. Create `Workspace` with `{ balance: 0 }`
4. Create `WorkspaceUser` with `{ userId, workspaceId, permission: 'OWNER' }`
5. Sign JWT: `jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })`
6. Set httpOnly cookie
7. Return `{ success: true, data: { id, username, displayName } }`

**Error handling:**

- Prisma error code `P2002` (unique constraint) → 409 `{ success: false, error: 'Username already taken' }`

**Cookie config:**

```typescript
res.cookie(COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});
```

### POST /api/auth/login

**Body:** `{ username: string, password: string }`

1. Find user by username (return 401 if not found)
2. `bcrypt.compare(password, user.passwordHash)` (return 401 if mismatch)
3. Sign JWT, set cookie
4. Return user data

### POST /api/auth/logout

1. Clear cookie: `res.clearCookie(COOKIE_NAME, { path: '/' })`
2. Return `{ success: true }`

### GET /api/auth/me

**Requires:** `requireAuth` middleware

1. Fetch user by `req.user.id` from DB (to get displayName)
2. Re-sign JWT and re-set cookie (sliding expiry)
3. Return `{ success: true, data: { id, username, displayName } }`

---

## Step 5: Cycle Service

**File: `apps/finance-tracker/src/server/services/cycle.ts`**

### calculateCycleDays(items)

```typescript
interface CycleDays {
  cycleStartDay: number | null;
  cycleEndDay: number | null;
}

export function calculateCycleDays(items: Array<{ type: string; dayOfMonth: number }>): CycleDays {
  if (items.length === 0) return { cycleStartDay: null, cycleEndDay: null };

  const incomes = items.filter((i) => i.type === 'INCOME');
  const payments = items.filter((i) => i.type !== 'INCOME');

  if (incomes.length === 0 && payments.length === 0) {
    return { cycleStartDay: null, cycleEndDay: null };
  }

  // Cycle starts on earliest income day; if no income, earliest payment day
  const startDay =
    incomes.length > 0
      ? Math.min(...incomes.map((i) => i.dayOfMonth))
      : Math.min(...payments.map((i) => i.dayOfMonth));

  if (payments.length === 0) {
    // Only income: cycle is just the income day
    return { cycleStartDay: startDay, cycleEndDay: startDay };
  }

  const lastPaymentDay = Math.max(...payments.map((i) => i.dayOfMonth));
  // Day after last payment; wraps 31→1
  const endDay = lastPaymentDay >= 31 ? 1 : lastPaymentDay + 1;

  return { cycleStartDay: startDay, cycleEndDay: endDay };
}
```

### calculateBalanceCards(balance, items)

```typescript
export function calculateBalanceCards(
  balance: number,
  items: Array<{ type: string; amount: number; isPaid: boolean }>
): BalanceCards {
  const incomes = items.filter((i) => i.type === 'INCOME');
  const payments = items.filter((i) => i.type !== 'INCOME');

  const unpaidIncomeSum = incomes
    .filter((i) => !i.isPaid)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const unpaidPaymentSum = payments
    .filter((i) => !i.isPaid)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalIncomeSum = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaymentSum = payments.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    currentBalance: balance,
    expectedBalance: balance + unpaidIncomeSum - unpaidPaymentSum,
    deficitExcess: totalIncomeSum - totalPaymentSum,
  };
}
```

### buildCycleLabel(startDay, endDay, referenceDate)

```typescript
export function buildCycleLabel(
  startDay: number,
  endDay: number,
  referenceDate: Date = new Date()
): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  const startMonth = monthNames[month];

  if (endDay > startDay) {
    // Same month: "Mar 5 - Mar 20"
    return `${startMonth} ${startDay} - ${startMonth} ${endDay}`;
  } else {
    // Wraps: "Jan 25 - Feb 16"
    const nextMonth = monthNames[(month + 1) % 12];
    return `${startMonth} ${startDay} - ${nextMonth} ${endDay}`;
  }
}
```

### archiveCycleIfNeeded(prisma, workspaceId)

```typescript
export async function archiveCycleIfNeeded(
  prisma: PrismaClient,
  workspaceId: number
): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    // Lock the workspace row for concurrent access (shared workspaces)
    const [workspace] = await tx.$queryRaw<any[]>`
      SELECT * FROM workspaces WHERE id = ${workspaceId} FOR UPDATE
    `;

    if (!workspace || !workspace.cycle_start_day) return false;

    const items = await tx.item.findMany({ where: { workspaceId } });
    if (items.length === 0) return false;

    // Check if all items are paid (cycle complete)
    const allPaid = items.every((item) => item.isPaid);
    if (!allPaid) return false;

    // Check if we're past the cycle end date
    const today = new Date();
    const currentDay = today.getDate();
    const cycleEndDay = workspace.cycle_end_day;

    // Determine if cycle has ended:
    // If cycle wraps (endDay <= startDay), ended when past endDay in the next month
    // If same month (endDay > startDay), ended when currentDay >= endDay
    const cycleWraps = cycleEndDay <= workspace.cycle_start_day;
    const pastEnd = cycleWraps
      ? currentDay >= cycleEndDay && currentDay < workspace.cycle_start_day
      : currentDay >= cycleEndDay;

    if (!pastEnd) return false;

    // Archive the completed cycle
    const cycleLabel = buildCycleLabel(workspace.cycle_start_day, cycleEndDay, today);

    await tx.completedCycle.create({
      data: {
        workspaceId,
        cycleLabel,
        finalBalance: workspace.balance,
        itemsSnapshot: items.map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          amount: Number(item.amount),
          dayOfMonth: item.dayOfMonth,
          isPaid: item.isPaid,
        })),
      },
    });

    // Reset all items for the new cycle
    await tx.item.updateMany({
      where: { workspaceId },
      data: { isPaid: false },
    });

    // Balance is NOT reset — it represents real bank balance

    return true;
  });
}
```

**Multi-month gap handling:** If the user hasn't opened the app for months, a single archive + reset is sufficient. The items are recurring with fixed `dayOfMonth`, and balance is manually managed.

---

## Step 6: Workspace + Items + Sharing Routes

### 6.1 Workspace Routes

**File: `apps/finance-tracker/src/server/routes/workspace.ts`**

Export `workspaceRouter(prisma): Router`. All routes use `requireAuth`.

#### GET /api/workspace

Optional query param: `?workspaceId=` (for viewing shared workspaces).

1. If no `workspaceId`, find user's OWNER workspace via `WorkspaceUser`
2. Verify user has access (any permission)
3. Call `archiveCycleIfNeeded(prisma, workspaceId)`
4. Fetch workspace with items (ordered by `dayOfMonth`)
5. Recalculate `cycleStartDay`/`cycleEndDay` from items (in case items were added/removed)
6. Update workspace if cycle days changed
7. Calculate balance cards
8. Build cycle label
9. Return `WorkspaceResponse` with user's permission

#### PUT /api/workspace/balance

**Body:** `{ balance: number }`

1. Find user's OWNER workspace (or specified `workspaceId`)
2. Check permission: OWNER or MEMBER
3. Update `workspace.balance`
4. Return updated workspace

### 6.2 Items Routes

**File: `apps/finance-tracker/src/server/routes/items.ts`**

Export `itemsRouter(prisma): Router`. All routes use `requireAuth`.

**Helper:** `getWorkspacePermission(prisma, userId, workspaceId)` — returns permission or null.

#### POST /api/items

**Body:** `{ workspaceId: number, type: ItemType, label: string, amount: number, dayOfMonth: number }`

**Validation:**

- `dayOfMonth`: 1-31
- `amount`: > 0
- `type`: valid enum value
- `label`: non-empty, trimmed

1. Verify OWNER or MEMBER permission
2. Create item with `isPaid: false`
3. Recalculate and update workspace cycle days
4. Return created item

#### PUT /api/items/:id

**Body:** Partial `{ label?, amount?, dayOfMonth?, isPaid?, type? }`

1. Find item, verify it belongs to a workspace the user has OWNER/MEMBER access to
2. **If `isPaid` is being toggled to `true`:**
   - Adjust workspace balance (subtract payment amount OR add income amount)
3. **If `isPaid` is being toggled to `false`:**
   - Reverse the balance adjustment
4. Update item
5. If `dayOfMonth` changed, recalculate workspace cycle days
6. Return updated item

#### DELETE /api/items/:id

1. Find item, verify workspace permission (OWNER/MEMBER)
2. Delete item
3. Recalculate workspace cycle days (set to null if no items remain)
4. Return `{ success: true }`

### 6.3 Sharing Routes

**File: `apps/finance-tracker/src/server/routes/sharing.ts`**

Export `sharingRouter(prisma): Router`. All routes use `requireAuth`.

#### GET /api/users/search?username=

1. Exact match (case-insensitive): `prisma.user.findFirst({ where: { username: { equals: query, mode: 'insensitive' } } })`
2. Return `{ id, username, displayName }` or empty result
3. Never return `passwordHash`

#### GET /api/workspaces/shared

1. Find all `WorkspaceUser` entries for the current user where `permission !== 'OWNER'`
2. Include workspace info and owner's displayName
3. Return list of shared workspaces with permissions

#### GET /api/workspace/:id/members

1. Verify user has access to the workspace
2. Return all `WorkspaceUser` entries with `{ userId, username, displayName, permission }`

#### POST /api/workspace/:id/members

**Body:** `{ userId: number, permission: 'MEMBER' | 'VIEWER' }`

**Permission checks:**

- OWNER can add MEMBER or VIEWER
- MEMBER can add VIEWER only
- VIEWER cannot add anyone

1. Verify target user exists
2. Verify target user not already a member
3. Create `WorkspaceUser`
4. Return created membership

#### DELETE /api/workspace/:id/members/:userId

**Permission checks:**

- OWNER can remove anyone (except self)
- MEMBER can remove other MEMBERs and VIEWERs (not OWNER)
- Any user can remove themselves (leave), EXCEPT the OWNER

1. Find the `WorkspaceUser` to remove
2. Apply permission checks
3. Delete `WorkspaceUser`
4. Return `{ success: true }`

---

## Step 7: Frontend Infrastructure

### 7.1 Tailwind CSS v4

**`vite.config.ts`** — already updated in Step 1 with `tailwindcss()` plugin.

**Create `apps/finance-tracker/src/client/style.css`:**

```css
@import 'tailwindcss';
```

**`apps/finance-tracker/src/client/main.ts`:**

```typescript
import './style.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

### 7.2 Vue Router

**File: `apps/finance-tracker/src/client/router/index.ts`**

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/',
      name: 'workspace',
      component: () => import('@/views/WorkspaceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/shared',
      name: 'shared',
      component: () => import('@/views/SharedWorkspacesView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.isChecked) await auth.checkSession();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' };
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'workspace' };
  }
});

export default router;
```

### 7.3 API Composable

**File: `apps/finance-tracker/src/client/composables/useApi.ts`**

```typescript
export async function api<T>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (res.status === 401) {
      window.location.href = '/login';
      return { success: false, error: 'Not authenticated' };
    }
    return json;
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
```

### 7.4 Pinia Stores

#### Auth Store

**File: `apps/finance-tracker/src/client/stores/auth.ts`**

```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isChecked = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  async function checkSession() {
    /* GET /api/auth/me */
  }
  async function login(username: string, password: string) {
    /* POST /api/auth/login */
  }
  async function register(username: string, displayName: string, password: string) {
    /* POST /api/auth/register */
  }
  async function logout() {
    /* POST /api/auth/logout */
  }

  return {
    user,
    isChecked,
    loading,
    error,
    isAuthenticated,
    checkSession,
    login,
    register,
    logout,
  };
});
```

#### Workspace Store

**File: `apps/finance-tracker/src/client/stores/workspace.ts`**

```typescript
export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<WorkspaceData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const items = computed(() => workspace.value?.items ?? []);
  const incomeItems = computed(() => items.value.filter((i) => i.type === 'INCOME'));
  const paymentItems = computed(() => items.value.filter((i) => i.type !== 'INCOME'));
  const isEmpty = computed(() => items.value.length === 0);
  const allPaid = computed(() => items.value.length > 0 && items.value.every((i) => i.isPaid));
  const permission = computed(() => workspace.value?.permission ?? 'VIEWER');
  const canEdit = computed(() => permission.value === 'OWNER' || permission.value === 'MEMBER');

  async function fetchWorkspace(workspaceId?: number) {
    /* GET /api/workspace */
  }
  async function updateBalance(balance: number) {
    /* PUT /api/workspace/balance */
  }
  async function addItem(data: CreateItemData) {
    /* POST /api/items */
  }
  async function updateItem(id: number, data: Partial<Item>) {
    /* PUT /api/items/:id */
  }
  async function deleteItem(id: number) {
    /* DELETE /api/items/:id */
  }
  async function togglePaid(item: Item) {
    /* PUT /api/items/:id { isPaid: !item.isPaid } */
  }

  return {
    workspace,
    loading,
    error,
    items,
    incomeItems,
    paymentItems,
    isEmpty,
    allPaid,
    permission,
    canEdit,
    fetchWorkspace,
    updateBalance,
    addItem,
    updateItem,
    deleteItem,
    togglePaid,
  };
});
```

**Client-side balance recalculation:** After `togglePaid`, recalculate balance cards locally for instant feedback, then the next `fetchWorkspace` syncs with server truth.

#### Sharing Store

**File: `apps/finance-tracker/src/client/stores/sharing.ts`**

```typescript
export const useSharingStore = defineStore('sharing', () => {
  const members = ref<Member[]>([]);
  const sharedWorkspaces = ref<SharedWorkspace[]>([]);
  const searchResult = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMembers(workspaceId: number) {
    /* GET /api/workspace/:id/members */
  }
  async function fetchSharedWorkspaces() {
    /* GET /api/workspaces/shared */
  }
  async function searchUser(username: string) {
    /* GET /api/users/search?username= */
  }
  async function addMember(workspaceId: number, userId: number, permission: string) {
    /* POST */
  }
  async function removeMember(workspaceId: number, userId: number) {
    /* DELETE */
  }

  return {
    members,
    sharedWorkspaces,
    searchResult,
    loading,
    error,
    fetchMembers,
    fetchSharedWorkspaces,
    searchUser,
    addMember,
    removeMember,
  };
});
```

### 7.5 Frontend Types

**File: `apps/finance-tracker/src/client/types.ts`**

```typescript
export interface User {
  id: number;
  username: string;
  displayName: string;
}

export type ItemType = 'INCOME' | 'CREDIT_CARD' | 'LOAN_PAYMENT' | 'RENT' | 'OTHER';
export type Permission = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface Item {
  id: number;
  type: ItemType;
  label: string;
  amount: number;
  dayOfMonth: number;
  isPaid: boolean;
}

export interface BalanceCards {
  currentBalance: number;
  expectedBalance: number;
  deficitExcess: number;
}

export interface WorkspaceData {
  workspace: {
    id: number;
    balance: number;
    cycleStartDay: number | null;
    cycleEndDay: number | null;
  };
  items: Item[];
  balanceCards: BalanceCards;
  cycleLabel: string | null;
  permission: Permission;
}

export interface Member {
  userId: number;
  username: string;
  displayName: string;
  permission: Permission;
}

export interface SharedWorkspace {
  workspaceId: number;
  ownerDisplayName: string;
  permission: Permission;
}

export interface CreateItemData {
  workspaceId: number;
  type: ItemType;
  label: string;
  amount: number;
  dayOfMonth: number;
}

// Item type display metadata
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  INCOME: 'Income',
  CREDIT_CARD: 'Credit Card',
  LOAN_PAYMENT: 'Loan Payment',
  RENT: 'Rent',
  OTHER: 'Other',
};

export const ITEM_TYPE_IS_INCOME: Record<ItemType, boolean> = {
  INCOME: true,
  CREDIT_CARD: false,
  LOAN_PAYMENT: false,
  RENT: false,
  OTHER: false,
};
```

---

## Step 8: Frontend Views + Components

### 8.1 Component Structure

```
src/client/
  App.vue                       — <RouterView /> wrapper
  views/
    LoginView.vue               — Login form (username + password)
    RegisterView.vue            — Register form (username + displayName + password)
    WorkspaceView.vue           — Main dashboard (3 workspace states)
    SharedWorkspacesView.vue    — List of shared workspaces
  components/
    AppHeader.vue               — Top bar: display name, nav (My Workspace / Shared), logout
    BalanceCards.vue             — 3 cards: Current Balance, Expected Balance, Deficit/Excess
    ItemList.vue                — Sorted item cards with type badges, paid checkboxes, edit/delete
    ItemForm.vue                — Modal/form for add/edit item (label, amount, day, type)
    EmptyState.vue              — Friendly prompt + CTA to add first item
    MemberList.vue              — Workspace members with permission badges + remove buttons
    AddMemberForm.vue           — Username search + permission select + add button
```

### 8.2 View Details

#### LoginView.vue

- Simple form: username input, password input, submit button
- Link to register page
- Error display from auth store
- On success: router pushes to `/`

#### RegisterView.vue

- Form: username, display name, password inputs
- Validation feedback (username requirements, password length)
- Link to login page
- On success: router pushes to `/`

#### WorkspaceView.vue

Main dashboard with 3 states:

1. **Empty state** (`isEmpty`): Shows `EmptyState` component with CTA to add first item
2. **Active cycle** (has items, not all paid): `BalanceCards` at top, CTA button to add item, `ItemList` below
3. **Between cycles** (`allPaid`): Summary of completed cycle, indication of next cycle start

Also includes:

- Balance edit functionality (click on Current Balance card to edit inline)
- Members/sharing section (expandable or separate tab)
- Workspace reset action (clears all items, sets balance to 0)

#### SharedWorkspacesView.vue

- Lists all workspaces shared with user (from sharing store)
- Each shows owner name, user's permission, "View" button
- "Leave" button to remove self from workspace
- Link back to own workspace

### 8.3 Component Details

#### BalanceCards.vue

**Props:** `{ currentBalance, expectedBalance, deficitExcess, canEdit }`
**Events:** `@update-balance`

- Three cards in a row (responsive: stack on mobile)
- Current Balance: green card, editable (if canEdit)
- Expected Balance: blue card, non-editable
- Deficit/Excess: green if positive ("Surplus +X"), red if negative ("Deficit -X")

#### ItemList.vue

**Props:** `{ items, canEdit }`
**Events:** `@toggle-paid`, `@edit`, `@delete`

- Items sorted by `dayOfMonth`
- Each item card shows:
  - Type badge (colored: green for income, red/orange for payments)
  - Label and amount
  - "Day X" indicator
  - Checkbox for `isPaid` (only if canEdit)
  - Edit/Delete icons (only if canEdit)
- **Overdue highlighting**: If today's date >= item's dayOfMonth and !isPaid, show visual emphasis (amber border/badge)
- Paid items: greyed out with strikethrough or checkmark

#### ItemForm.vue

**Props:** `{ item?: Item }` (if editing)
**Events:** `@submit`, `@cancel`

- Fields: label (text), amount (number), dayOfMonth (select 1-31), type (dropdown of ItemType)
- If `item` prop provided, pre-fill for editing
- Validation: all required, amount > 0, dayOfMonth 1-31

#### AppHeader.vue

- Left: App name "Finance Tracker"
- Center: Nav links — "My Workspace" (/) and "Shared" (/shared)
- Right: User display name, logout button

---

## Step 9: Sanity Tests

### 9.1 Test Setup

**File: `apps/finance-tracker/src/__tests__/setup.ts`**

Same pattern as template — load `.env` with dotenv.

### 9.2 Backend API Tests

**File: `apps/finance-tracker/src/__tests__/api.spec.ts`**

Using supertest against the exported `app`:

```typescript
import request from 'supertest';
import { app, prisma } from '../server/index.js';

// Helper to register and get cookie
async function registerUser(username: string, displayName: string, password: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, displayName, password });
  const cookie = res.headers['set-cookie'];
  return { res, cookie };
}

beforeEach(async () => {
  // Clean all tables in reverse dependency order
  await prisma.completedCycle.deleteMany();
  await prisma.item.deleteMany();
  await prisma.workspaceUser.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**Test suites:**

1. **Auth**
   - POST /api/auth/register creates user and returns cookie
   - POST /api/auth/register with duplicate username returns 409
   - POST /api/auth/login with valid creds returns cookie
   - POST /api/auth/login with wrong password returns 401
   - GET /api/auth/me without cookie returns 401
   - GET /api/auth/me with valid cookie returns user
   - POST /api/auth/logout clears cookie

2. **Workspace**
   - GET /api/workspace returns user's workspace with empty items
   - PUT /api/workspace/balance updates balance
   - Unauthenticated request returns 401

3. **Items**
   - POST /api/items creates item
   - POST /api/items with invalid dayOfMonth returns 400
   - PUT /api/items/:id updates item
   - PUT /api/items/:id toggles isPaid and adjusts balance
   - DELETE /api/items/:id removes item

4. **Sharing**
   - GET /api/users/search finds user by username
   - POST /api/workspace/:id/members adds member
   - DELETE /api/workspace/:id/members/:userId removes member
   - VIEWER cannot create items (403)

### 9.3 Cycle Unit Tests

**File: `apps/finance-tracker/src/__tests__/cycle.spec.ts`**

```typescript
import { calculateCycleDays, calculateBalanceCards, buildCycleLabel } from '../server/services/cycle.js';

describe('calculateCycleDays', () => {
  test('returns null for empty items', ...);
  test('income on 10, payment on 20 → { 10, 21 }', ...);
  test('income on 25, payment on 15 → { 25, 16 } (wraps)', ...);
  test('income on 1, payment on 31 → { 1, 1 } (wraps past 31)', ...);
  test('income only → { day, day }', ...);
});

describe('calculateBalanceCards', () => {
  test('all unpaid: expected = balance + incomes - payments', ...);
  test('some paid: expected uses only unpaid', ...);
  test('deficitExcess uses all items regardless of isPaid', ...);
});

describe('buildCycleLabel', () => {
  test('same month: "Mar 5 - Mar 20"', ...);
  test('wrapping: "Jan 25 - Feb 16"', ...);
});
```

### 9.4 Frontend Tests

**File: `apps/finance-tracker/src/client/__tests__/App.spec.ts`**

- Mock fetch to return 401 for `/api/auth/me`
- Mount App with router and Pinia
- Assert login page renders

---

## Step 10: Final Verification

1. `pnpm install` — install all deps
2. `pnpm build --filter=finance-tracker` — confirm clean build
3. `pnpm test:finance-tracker` — all tests pass
4. `pnpm lint` — no lint errors
5. `pnpm dev --filter=finance-tracker` — starts on 5180/3010
6. Manual smoke test:
   - Register new user → lands on empty workspace
   - Add income item (day 10, amount 5000)
   - Add payment items (rent day 1, credit card day 15)
   - See balance cards calculate correctly
   - Update current balance
   - Toggle items as paid → balance adjusts
   - Share workspace with another user
   - Login as second user → see shared workspace in list
   - Navigate to shared workspace → view-only if VIEWER

---

## Files Changed Summary

### Root Monorepo (4 files modified)

- `tsconfig.json` — add reference
- `vitest.config.ts` — add project
- `package.json` — add scripts
- `eslint.config.js` — add to serverApps

### New App: `apps/finance-tracker/` (all new files)

**Config files** (copied from template, modified):

- `package.json`, `vite.config.ts`, `vitest.config.ts`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.node.json`, `tsconfig.vitest.json`
- `.env`, `.env.example`, `prisma.config.ts`, `env.d.ts`

**Prisma:**

- `prisma/schema.prisma`
- `prisma/seed.ts`

**Backend (~10 files):**

- `src/server/index.ts`
- `src/server/config.ts`
- `src/server/types.ts`
- `src/server/middleware/auth.ts`
- `src/server/middleware/error.ts`
- `src/server/routes/auth.ts`
- `src/server/routes/workspace.ts`
- `src/server/routes/items.ts`
- `src/server/routes/sharing.ts`
- `src/server/services/cycle.ts`

**Frontend (~16 files):**

- `src/client/index.html`
- `src/client/main.ts`
- `src/client/style.css`
- `src/client/App.vue`
- `src/client/types.ts`
- `src/client/router/index.ts`
- `src/client/composables/useApi.ts`
- `src/client/stores/auth.ts`
- `src/client/stores/workspace.ts`
- `src/client/stores/sharing.ts`
- `src/client/views/LoginView.vue`
- `src/client/views/RegisterView.vue`
- `src/client/views/WorkspaceView.vue`
- `src/client/views/SharedWorkspacesView.vue`
- `src/client/components/AppHeader.vue`
- `src/client/components/BalanceCards.vue`
- `src/client/components/ItemList.vue`
- `src/client/components/ItemForm.vue`
- `src/client/components/EmptyState.vue`
- `src/client/components/MemberList.vue`
- `src/client/components/AddMemberForm.vue`

**Tests (~4 files):**

- `src/__tests__/setup.ts`
- `src/__tests__/api.spec.ts`
- `src/__tests__/cycle.spec.ts`
- `src/client/__tests__/App.spec.ts`
