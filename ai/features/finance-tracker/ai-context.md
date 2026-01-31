# Finance Tracker - AI Implementation Context

> **Purpose**: This document provides comprehensive context for an AI agent implementing the Finance Tracker application. Read this document in full before starting implementation.

---

## Quick Reference

| Document        | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `request.md`    | Product requirements and business logic                    |
| `design.md`     | Technical design, architecture, and implementation details |
| `ai-context.md` | This file - implementation guidance for AI agents          |

**IMPORTANT**: Always read `request.md` and `design.md` first. This document supplements them with implementation-specific guidance.

---

## Repository Structure

This project lives in a **monorepo** using npm workspaces.

### Root Structure

```
website/                          # Root of monorepo
├── packages/                     # All apps live here
│   └── finance-tracker/          # ← THIS APP (to be created)
├── deployer/                     # Deployment tool for Vercel
│   └── app/                      # Deployer application
├── ai/                           # AI-related documentation
│   └── features/
│       └── finance-tracker/      # Feature documentation
│           ├── request.md        # Requirements
│           ├── design.md         # Technical design
│           └── ai-context.md     # This file
├── package.json                  # Root package.json with workspaces
├── tsconfig.json                 # Base TypeScript config
├── eslint.config.js              # ESLint configuration
├── vitest.config.ts              # Vitest configuration
├── vitest.workspace.ts           # Vitest workspace config
├── .prettierrc                   # Prettier configuration
└── .gitignore                    # Git ignore rules
```

### Creating the Finance Tracker Package

Create the app at: `packages/finance-tracker/`

```
packages/finance-tracker/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n routing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── items/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── workspaces/page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── user/
│   │   ├── workspace/
│   │   └── items/
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Root redirect
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/
│   ├── items/
│   ├── workspace/
│   └── layout/
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # JWT utilities
│   ├── cycle.ts                  # Cycle calculation
│   ├── currency.ts               # Currency formatting
│   └── validations.ts            # Zod schemas
├── hooks/
├── messages/                     # i18n translations
│   ├── en.json
│   └── he.json
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts
├── public/
├── .env.local                    # Local environment (gitignored)
├── .env.example                  # Environment template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Monorepo Conventions

### Package.json Setup

The root `package.json` uses npm workspaces:

```json
{
  "workspaces": ["packages/*"]
}
```

The finance-tracker `package.json` should follow this pattern:

```json
{
  "name": "finance-tracker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@prisma/client": "^5.x",
    "bcryptjs": "^2.x",
    "jsonwebtoken": "^9.x",
    "zod": "^3.x",
    "@tanstack/react-query": "^5.x",
    "next-intl": "^3.x",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@types/node": "^22.x",
    "@types/react": "^18.x",
    "@types/bcryptjs": "^2.x",
    "@types/jsonwebtoken": "^9.x",
    "prisma": "^5.x",
    "typescript": "^5.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### Running Commands

From the **root** of the monorepo:

```bash
# Install dependencies for all workspaces
npm install

# Run commands in specific workspace
npm run dev -w finance-tracker
npm run build -w finance-tracker
npm run test -w finance-tracker

# Or cd into the package
cd packages/finance-tracker
npm run dev
```

### Adding to Root Scripts

After creating the package, update root `package.json`:

```json
{
  "scripts": {
    "dev:finance-tracker": "npm run dev -w finance-tracker",
    "build:finance-tracker": "npm run build -w finance-tracker",
    "test:finance-tracker": "vitest --project finance-tracker"
  }
}
```

---

## Deployer Tool

The repository includes a **Vercel deployer** tool at `deployer/app/` that handles deployment to `*.vinguler.com`.

### How It Works

1. **Scan**: Detects Node.js projects in `packages/`
2. **Analyze**: Identifies framework, database, environment variables
3. **Deploy**: Pushes to Vercel with custom subdomain

### Deployer Configuration

Each package can have a `.deployer.json` file (auto-generated):

```json
{
  "name": "finance-tracker",
  "subdomain": "finance",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "envVars": ["DATABASE_URL", "JWT_SECRET"],
  "database": {
    "type": "postgresql",
    "provider": "neon"
  }
}
```

### Deployment URL

After deployment, the app will be available at:

- **Production**: `https://finance.vinguler.com`
- **Preview**: `https://finance-{branch}.vinguler.com`

### Environment Variables for Vercel

Required environment variables (set via deployer or Vercel dashboard):

```env
DATABASE_URL=postgresql://...@neon.tech/finance-tracker
JWT_SECRET=your-32-character-secret-key
NEXTAUTH_SECRET=your-nextauth-secret (if using NextAuth)
```

---

## Tech Stack Details

### Next.js 14 App Router

Use the App Router (not Pages Router):

```typescript
// app/[locale]/(dashboard)/page.tsx
export default function DashboardPage() {
  return <Dashboard />;
}
```

**Key patterns:**

- Server Components by default
- `"use client"` directive for client components
- Route groups with `(parentheses)` for layout organization
- Dynamic routes with `[brackets]`

### Prisma Setup

```bash
# Initialize Prisma
npx prisma init

# Generate client after schema changes
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name init
```

**Prisma Client singleton** (`lib/db.ts`):

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### shadcn/ui Setup

Initialize shadcn/ui in the package:

```bash
npx shadcn@latest init
```

Configuration (`components.json`):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

Install required components:

```bash
npx shadcn@latest add button input label card dialog dropdown-menu select toast tooltip popover badge
```

### next-intl Setup

**Middleware** (`middleware.ts`):

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/', '/(en|he)/:path*'],
};
```

**Configuration** (`i18n/config.ts`):

```typescript
export const locales = ['en', 'he'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
};

export const localeDirection: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  he: 'rtl',
};
```

---

## Implementation Guidelines

### 1. Authentication Implementation

**JWT Token Structure:**

```typescript
interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}
```

**Cookie Configuration:**

```typescript
import { cookies } from 'next/headers';

const TOKEN_NAME = 'finance-tracker-token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function setAuthCookie(token: string) {
  cookies().set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });
}
```

**Password Hashing:**

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. Cycle Calculation Logic

This is the **most complex** part of the app. Implement in `lib/cycle.ts`.

**Key Algorithm:**

```typescript
import { RecurringItem } from '@prisma/client';

interface CycleInfo {
  startDate: Date;
  endDate: Date;
  salaryDate: Date;
  lastExpenseDate: Date;
  daysInCycle: number;
}

export function calculateCycle(items: RecurringItem[], today: Date = new Date()): CycleInfo | null {
  const incomes = items.filter((i) => i.type === 'INCOME');
  const expenses = items.filter((i) => i.type === 'EXPENSE');

  if (incomes.length === 0) {
    return null; // Can't calculate cycle without income
  }

  // Find the earliest income day (salary day)
  const salaryDay = Math.min(...incomes.map((i) => i.dayOfMonth));

  // Find the latest expense day BEFORE the salary day
  const expensesBeforeSalary = expenses.filter((e) => e.dayOfMonth < salaryDay);
  const expensesSameOrAfterSalary = expenses.filter((e) => e.dayOfMonth >= salaryDay);

  let lastExpenseDay: number;
  let cycleSpansMonths: boolean;

  if (expensesBeforeSalary.length > 0) {
    // Expenses exist before salary in same month
    lastExpenseDay = Math.max(...expensesBeforeSalary.map((e) => e.dayOfMonth));
    cycleSpansMonths = false;
  } else if (expensesSameOrAfterSalary.length > 0) {
    // All expenses are after salary, cycle spans to next month
    lastExpenseDay = Math.max(...expensesSameOrAfterSalary.map((e) => e.dayOfMonth));
    cycleSpansMonths = true;
  } else {
    // No expenses, cycle ends day before salary
    lastExpenseDay = salaryDay - 1;
    cycleSpansMonths = false;
  }

  // Calculate actual dates based on today
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  // Determine which cycle we're in
  // ... (complex date logic here)

  return {
    startDate,
    endDate,
    salaryDate,
    lastExpenseDate,
    daysInCycle,
  };
}
```

**Timeline Generation:**

```typescript
interface TimelineDay {
  date: Date;
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
  items: TimelineItem[];
  runningBalance: number;
}

interface TimelineItem {
  id: string;
  label: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: string;
}

export function generateTimeline(
  items: RecurringItem[],
  currentBalance: number,
  cycle: CycleInfo
): TimelineDay[] {
  const timeline: TimelineDay[] = [];
  const today = new Date();
  let runningBalance = currentBalance;

  // Iterate from cycle start to cycle end
  const current = new Date(cycle.startDate);
  while (current <= cycle.endDate) {
    const dayOfMonth = current.getDate();
    const dayItems = items
      .filter((item) => item.dayOfMonth === dayOfMonth)
      .map((item) => ({
        id: item.id,
        label: item.label,
        amount: item.amount,
        type: item.type,
        category: item.category,
      }));

    // Calculate running balance
    for (const item of dayItems) {
      if (item.type === 'INCOME') {
        runningBalance += item.amount;
      } else {
        runningBalance -= item.amount;
      }
    }

    timeline.push({
      date: new Date(current),
      dayOfMonth,
      isToday: isSameDay(current, today),
      isPast: current < today,
      items: dayItems,
      runningBalance,
    });

    current.setDate(current.getDate() + 1);
  }

  return timeline;
}
```

### 3. Currency Handling

**Always store as integers (cents/agorot):**

```typescript
// lib/currency.ts

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(
  cents: number,
  currency: string = 'ILS',
  locale: string = 'en'
): string {
  const amount = fromCents(cents);
  return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-IL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Input component helper - convert display value to cents
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : toCents(parsed);
}
```

### 4. API Route Patterns

**Standard API response:**

```typescript
// lib/api.ts

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER';
  details?: Record<string, string>;
}

export function successResponse<T>(data: T): Response {
  return Response.json({ data }, { status: 200 });
}

export function errorResponse(
  error: string,
  code: ApiResponse<never>['code'],
  status: number,
  details?: Record<string, string>
): Response {
  return Response.json({ error, code, details }, { status });
}
```

**Route handler with auth:**

```typescript
// app/api/workspace/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
      },
      include: {
        members: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
    });

    // Transform to include user's role and member count
    const result = workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      role: ws.ownerId === user.id ? 'OWNER' : ws.members[0]?.role,
      isMain: ws.id === user.mainWorkspaceId,
      memberCount: ws._count?.members || 0,
    }));

    return successResponse({ workspaces: result });
  } catch (error) {
    console.error('GET /api/workspace error:', error);
    return errorResponse('Internal server error', 'SERVER', 500);
  }
}
```

### 5. Zod Validation Schemas

```typescript
// lib/validations.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(1).max(50),
});

export const itemSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  category: z.enum(['LOAN', 'CREDIT_CARD', 'RENT', 'DAYCARE', 'OTHER', 'SALARY']),
  label: z.string().min(1).max(50),
  amount: z.number().positive().int(), // cents
  dayOfMonth: z.number().int().min(1).max(28),
});

export const workspaceSchema = z.object({
  name: z.string().min(1).max(50),
});

export const updateBalanceSchema = z.object({
  currentBalance: z.number().int(), // can be negative
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
```

---

## Testing Patterns

### Vitest Setup

Add to `packages/finance-tracker/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

Add to root `vitest.workspace.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/finance-tracker/vitest.config.ts'],
  },
});
```

### Unit Tests for Cycle Logic

```typescript
// lib/__tests__/cycle.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCycle, generateTimeline } from '../cycle';

describe('calculateCycle', () => {
  it('calculates cycle ending after last expense before salary', () => {
    const items = [
      { type: 'INCOME', category: 'SALARY', dayOfMonth: 10, amount: 1500000 },
      { type: 'EXPENSE', category: 'LOAN', dayOfMonth: 5, amount: 200000 },
    ];

    const cycle = calculateCycle(items, new Date('2024-01-15'));

    expect(cycle).not.toBeNull();
    expect(cycle!.endDate.getDate()).toBe(6); // Day after loan
  });

  it('returns null when no income items', () => {
    const items = [{ type: 'EXPENSE', category: 'RENT', dayOfMonth: 1, amount: 400000 }];

    const cycle = calculateCycle(items);
    expect(cycle).toBeNull();
  });
});
```

---

## Common Pitfalls & Solutions

### 1. Prisma in Next.js Edge Runtime

**Problem**: Prisma doesn't work in Edge runtime.

**Solution**: Use Node.js runtime for API routes:

```typescript
// app/api/workspace/route.ts
export const runtime = 'nodejs'; // Force Node.js runtime
```

### 2. Hydration Mismatches with Dates

**Problem**: Server and client render different dates.

**Solution**: Format dates on client only:

```typescript
'use client';

import { useEffect, useState } from 'react';

function DateDisplay({ date }: { date: Date }) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    setFormatted(date.toLocaleDateString());
  }, [date]);

  if (!formatted) return null;
  return <span>{formatted}</span>;
}
```

### 3. RTL Layout Issues

**Problem**: UI breaks in RTL mode.

**Solution**: Use logical CSS properties:

```css
/* Use these */
.item {
  margin-inline-start: 1rem;  /* Not margin-left */
  padding-inline-end: 1rem;   /* Not padding-right */
  text-align: start;          /* Not text-align: left */
}

/* Tailwind RTL utilities */
<div className="ms-4 me-2 ps-4 pe-2">
```

### 4. Currency Input Issues

**Problem**: Floating point precision errors.

**Solution**: Always use integers (cents):

```typescript
// ❌ Wrong
const balance = 123.45;

// ✅ Correct
const balanceInCents = 12345;
const displayValue = formatCurrency(balanceInCents);
```

### 5. Middleware Conflicts with API Routes

**Problem**: next-intl middleware interfering with API routes.

**Solution**: Exclude API routes in matcher:

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/',
    '/(en|he)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)', // Exclude api routes
  ],
};
```

---

## Environment Variables

### Local Development (.env.local)

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/finance-tracker?sslmode=require"

# Auth
JWT_SECRET="your-32-char-secret-key-here-abc"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (Vercel)

Set via Vercel dashboard or deployer:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret-key"
NEXT_PUBLIC_APP_URL="https://finance.vinguler.com"
```

---

## File Naming Conventions

| Type       | Convention                  | Example             |
| ---------- | --------------------------- | ------------------- |
| Components | PascalCase                  | `SummaryCards.tsx`  |
| Hooks      | camelCase with `use` prefix | `useWorkspace.ts`   |
| Utilities  | camelCase                   | `formatCurrency.ts` |
| Types      | PascalCase                  | `WorkspaceWithRole` |
| API routes | lowercase                   | `route.ts`          |
| Test files | `*.test.ts` or `*.spec.ts`  | `cycle.test.ts`     |

---

## Implementation Order

Follow this order for a smooth implementation:

### Phase 1: Foundation (Do First)

1. Create `packages/finance-tracker/` directory structure
2. Initialize package.json with dependencies
3. Set up Prisma schema (including CycleSnapshot) and generate client
4. Configure Next.js, Tailwind, shadcn/ui
5. Set up next-intl with he-IL/en-IL/en-US locales
6. Create Prisma client singleton
7. Create date/currency formatting utilities

### Phase 2: Authentication

8. Implement auth utilities (JWT, bcrypt)
9. Create register API route (with auto-create workspace)
10. Create login API route
11. Create auth middleware
12. Build login/register pages

### Phase 3: Core Data

13. Implement workspace API routes (CRUD, no delete, add reset)
14. Implement recurring items CRUD API routes
15. Build Zod validation schemas
16. Implement cycle calculation logic (critical!)

### Phase 4: Dashboard UI

17. Build layout components (Header, Sidebar)
18. Build SummaryCards component
19. Build CycleTimeline component
20. Build UpcomingItems component
21. Build empty state with CTAs

### Phase 5: Item Management

22. Build ItemForm component
23. Build ItemList component
24. Implement item add/edit/delete flows

### Phase 6: Workspace Features

25. Build WorkspaceSwitcher component
26. Build WorkspaceList page (with member counts)
27. Implement main workspace flag
28. Build member management page

### Phase 7: History & Settings

29. Implement CycleSnapshot creation logic
30. Build cycle history view
31. Build settings page (user + workspace)
32. Implement reset workspace
33. Implement delete account

### Phase 8: Polish

34. Add loading states
35. Add error handling
36. Test RTL layout
37. Test date formatting per locale
38. Mobile responsiveness
39. Create .deployer.json for deployment

---

## Useful Code Snippets

### Debounced Balance Update

```typescript
import { useMutation } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

function BalanceInput({ workspaceId, initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, 500);

  const mutation = useMutation({
    mutationFn: (balance: number) =>
      fetch(`/api/workspace/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ currentBalance: balance }),
      }),
  });

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      mutation.mutate(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <input
      type="number"
      value={fromCents(value)}
      onChange={(e) => setValue(toCents(parseFloat(e.target.value) || 0))}
    />
  );
}
```

### Permission Check Hook

```typescript
// hooks/usePermissions.ts
import { useWorkspace } from './useWorkspace';

export function usePermissions() {
  const { workspace, userRole } = useWorkspace();

  return {
    canEdit: userRole === 'OWNER' || userRole === 'MEMBER',
    canInviteMembers: userRole === 'OWNER',
    canInviteViewers: userRole === 'OWNER' || userRole === 'MEMBER',
    canRemoveMembers: userRole === 'OWNER' || userRole === 'MEMBER',
    canResetWorkspace: userRole === 'OWNER',
    canManageMembers: userRole === 'OWNER' || userRole === 'MEMBER',
    isViewer: userRole === 'VIEWER',
    isOwner: userRole === 'OWNER',
  };
}
```

### Timeline Auto-Scroll

```typescript
// components/dashboard/CycleTimeline.tsx
'use client';

import { useRef, useEffect } from 'react';

function CycleTimeline({ timeline }: Props) {
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to today on mount
    todayRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    });
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {timeline.map((day) => (
          <div
            key={day.date.toISOString()}
            ref={day.isToday ? todayRef : null}
            className={cn(
              'flex flex-col items-center',
              day.isToday && 'ring-2 ring-blue-500'
            )}
          >
            {/* Day content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Final Checklist

Before considering implementation complete:

**Core:**

- [ ] All API routes return consistent response format
- [ ] All forms have Zod validation
- [ ] All monetary values stored as cents
- [ ] Auth middleware protects all dashboard routes

**Cycle & Timeline:**

- [ ] Cycle calculation handles edge cases (no income, no expenses)
- [ ] Timeline scrolls to today on load
- [ ] CycleSnapshot created when cycle ends

**Workspace:**

- [ ] Auto-create workspace on registration
- [ ] Reset workspace clears items/balance (keeps members/snapshots)
- [ ] Workspace shows member count (not names)
- [ ] No delete workspace option

**Account:**

- [ ] Delete account requires password confirmation
- [ ] Delete account cascades all data

**Localization:**

- [ ] RTL layout works correctly for Hebrew
- [ ] Date format respects locale (DD/MM for he-IL, en-IL)
- [ ] Currency formatting respects locale

**UX:**

- [ ] Empty states have helpful CTAs
- [ ] Loading states for async operations
- [ ] Error toasts for failed operations
- [ ] Mobile responsive layout

**Deployment:**

- [ ] `.deployer.json` created for deployment
- [ ] Environment variables documented in `.env.example`
- [ ] README.md with setup instructions

---

## Clarified Decisions

These questions were answered by the user:

| Question                               | Answer                                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Auto-create workspace on registration? | **Yes** - auto-create with CTA in empty state. Many users will just be members of existing workspaces.            |
| What if user deletes only workspace?   | **No delete workspace** - only "Reset Workspace" (clears items/balance) or "Delete Account" (removes everything). |
| Should viewers see member names?       | **Just count** with link to "Manage Members". Focus on balance, not member details.                               |
| Date format preference?                | **DD/MM/YYYY** (Israel default). Use locale-based formatting: `he-IL`, `en-IL`, `en-US`.                          |
| Track balance history?                 | **Yes** - create `CycleSnapshot` when cycle ends. Not every change, just end-of-cycle snapshots.                  |

---

## CycleSnapshot Implementation

**IMPORTANT**: This is a new feature that must be implemented.

### When to Create Snapshots

Create a snapshot when a new cycle begins (capturing how the previous cycle ended):

```typescript
// lib/snapshot.ts
export async function createCycleSnapshotIfNeeded(workspaceId: string, currentCycle: CycleInfo) {
  // Check if we already have a snapshot for this cycle
  const existing = await prisma.cycleSnapshot.findFirst({
    where: {
      workspaceId,
      cycleEndDate: currentCycle.endDate,
    },
  });

  if (existing) return; // Already snapshotted

  // Check if cycle has ended
  const today = new Date();
  if (today <= currentCycle.endDate) return; // Cycle still active

  // Create snapshot
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { items: true },
  });

  const totalIncome = workspace.items
    .filter((i) => i.type === 'INCOME')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = workspace.items
    .filter((i) => i.type === 'EXPENSE')
    .reduce((sum, i) => sum + i.amount, 0);

  await prisma.cycleSnapshot.create({
    data: {
      workspaceId,
      cycleStartDate: currentCycle.startDate,
      cycleEndDate: currentCycle.endDate,
      startBalance: 0, // Calculate from previous snapshot or 0
      endBalance: workspace.currentBalance,
      totalIncome,
      totalExpenses,
      expectedEnd: totalIncome - totalExpenses,
      itemsSnapshot: workspace.items.map((i) => ({
        label: i.label,
        amount: i.amount,
        type: i.type,
        category: i.category,
        dayOfMonth: i.dayOfMonth,
      })),
    },
  });
}
```

### Prisma Schema Addition

```prisma
model CycleSnapshot {
  id              String    @id @default(cuid())
  cycleStartDate  DateTime
  cycleEndDate    DateTime
  startBalance    Int       // cents
  endBalance      Int       // cents
  totalIncome     Int       // cents
  totalExpenses   Int       // cents
  expectedEnd     Int       // cents
  itemsSnapshot   Json      // Array of item snapshots
  createdAt       DateTime  @default(now())

  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, cycleEndDate])
}
```

---

## Delete Account & Reset Workspace

### Delete Account API

```typescript
// app/api/user/route.ts
export async function DELETE(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const { password } = await request.json();

  // Verify password
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const valid = await bcrypt.compare(password, dbUser.passwordHash);
  if (!valid) return errorResponse('Invalid password', 'FORBIDDEN', 403);

  // Delete user (cascades to owned workspaces, memberships)
  await prisma.user.delete({ where: { id: user.id } });

  // Clear auth cookie
  cookies().delete('finance-tracker-token');

  return successResponse({ success: true });
}
```

### Reset Workspace API

```typescript
// app/api/workspace/[id]/reset/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyAuth(request);
  const workspace = await getWorkspaceWithRole(params.id, user.id);

  if (!workspace || workspace.role !== 'OWNER') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  // Delete all items, reset balance (keep members and snapshots)
  await prisma.$transaction([
    prisma.recurringItem.deleteMany({ where: { workspaceId: params.id } }),
    prisma.workspace.update({
      where: { id: params.id },
      data: { currentBalance: 0 },
    }),
  ]);

  return successResponse({ success: true });
}
```

---

## Locale-Based Formatting

### Supported Locales

| Locale  | Language | Date Format | Example    |
| ------- | -------- | ----------- | ---------- |
| `he-IL` | Hebrew   | DD/MM/YYYY  | 15/01/2024 |
| `en-IL` | English  | DD/MM/YYYY  | 15/01/2024 |
| `en-US` | English  | MM/DD/YYYY  | 01/15/2024 |

### Formatting Utilities

```typescript
// lib/format.ts
export function formatDate(date: Date, locale: string = 'he-IL'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date, locale: string = 'he-IL'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatCurrency(
  cents: number,
  locale: string = 'he-IL',
  currency: string = 'ILS'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
```

---

**Good luck with the implementation!**
