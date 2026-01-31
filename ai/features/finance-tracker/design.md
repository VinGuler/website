# Finance Tracker - Design Document

## Tech Stack

| Layer      | Choice                           | Why                                                     |
| ---------- | -------------------------------- | ------------------------------------------------------- |
| Framework  | **Next.js 14 (App Router)**      | Full-stack, Vercel-native, React Server Components      |
| Language   | **TypeScript**                   | Type safety across frontend and backend                 |
| Database   | **PostgreSQL (Neon)**            | Relational data, Vercel integration, generous free tier |
| ORM        | **Prisma**                       | Type-safe queries, migrations, good DX                  |
| Auth       | **Custom (JWT + bcrypt)**        | Simple, no OAuth needed, full control                   |
| Styling    | **Tailwind CSS + shadcn/ui**     | Rapid development, consistent design system             |
| State      | **React Query (TanStack Query)** | Server state management, caching, optimistic updates    |
| Validation | **Zod**                          | Schema validation shared between client/server          |
| i18n       | **next-intl**                    | Next.js native, supports RTL, simple API                |

---

## Project Structure

```
finance-tracker/
├── app/
│   ├── [locale]/                   # i18n: en, he
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Auth guard, workspace context
│   │   │   ├── page.tsx            # Main dashboard
│   │   │   ├── items/page.tsx      # Manage recurring items
│   │   │   ├── settings/page.tsx   # Workspace & user settings
│   │   │   └── workspaces/page.tsx # Workspace switcher
│   │   └── layout.tsx              # Locale layout (RTL/LTR)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── user/
│   │   │   └── route.ts            # Update user preferences
│   │   ├── workspace/
│   │   │   ├── route.ts            # CRUD workspace
│   │   │   ├── [id]/route.ts
│   │   │   └── [id]/members/route.ts
│   │   └── items/
│   │       ├── route.ts            # CRUD recurring items
│   │       └── [id]/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn components
│   ├── dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── CycleTimeline.tsx
│   │   └── UpcomingItems.tsx
│   ├── items/
│   │   ├── ItemForm.tsx
│   │   └── ItemList.tsx
│   ├── workspace/
│   │   ├── WorkspaceSwitcher.tsx
│   │   └── WorkspaceList.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # JWT helpers
│   ├── cycle.ts                    # Cycle calculation logic
│   ├── currency.ts                 # Currency formatting (locale-aware)
│   └── validations.ts              # Zod schemas
├── hooks/
│   ├── useWorkspace.ts
│   ├── useCycle.ts
│   └── useItems.ts
├── messages/
│   ├── en.json                     # English translations
│   └── he.json                     # Hebrew translations
├── prisma/
│   └── schema.prisma
└── types/
    └── index.ts
```

---

## Database Schema

```prisma
model User {
  id              String            @id @default(cuid())
  username        String            @unique
  displayName     String
  passwordHash    String
  locale          String            @default("he-IL")  // "en-US" | "he-IL" (affects date format & language)
  mainWorkspaceId String?           // User's preferred workspace (can be any they have access to)
  createdAt       DateTime          @default(now())

  ownedWorkspaces Workspace[]       @relation("WorkspaceOwner")
  memberships     WorkspaceMember[]
}

model Workspace {
  id             String            @id @default(cuid())
  name           String
  currentBalance Int               @default(0)  // Store as cents/agorot
  currency       String            @default("ILS")  // For future: USD, EUR, etc.
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  ownerId        String
  owner          User              @relation("WorkspaceOwner", fields: [ownerId], references: [id])

  members        WorkspaceMember[]
  items          RecurringItem[]
  cycleSnapshots CycleSnapshot[]
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  role        Role      @default(VIEWER)
  createdAt   DateTime  @default(now())

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

model RecurringItem {
  id         String       @id @default(cuid())
  type       ItemType
  category   ItemCategory
  label      String
  amount     Int                              // Store as cents/agorot
  dayOfMonth Int                              // 1-28
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  workspaceId String
  workspace   Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

// Snapshot of how a cycle ended - for historical tracking
model CycleSnapshot {
  id              String    @id @default(cuid())
  cycleStartDate  DateTime  // When the cycle started
  cycleEndDate    DateTime  // When the cycle ended
  startBalance    Int       // Balance at cycle start (cents)
  endBalance      Int       // Actual balance at cycle end (cents)
  totalIncome     Int       // Sum of income for the cycle (cents)
  totalExpenses   Int       // Sum of expenses for the cycle (cents)
  expectedEnd     Int       // What we predicted the end balance would be (cents)
  createdAt       DateTime  @default(now())

  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Store a copy of the items at snapshot time (as JSON)
  itemsSnapshot   Json      // Array of { label, amount, type, category, dayOfMonth }

  @@index([workspaceId, cycleEndDate])
}

enum Role {
  OWNER
  MEMBER
  VIEWER
}

enum ItemType {
  EXPENSE
  INCOME
}

enum ItemCategory {
  LOAN
  CREDIT_CARD
  RENT
  DAYCARE
  OTHER
  SALARY
}
```

**Notes:**

- All monetary values stored as integers (cents/agorot) to avoid floating-point issues
- `mainWorkspaceId` on User can reference any workspace they have access to (owned or member/viewer)
- `locale` on User determines both language AND date format:
  - `he-IL`: Hebrew language, DD/MM/YYYY date format (default for Israel)
  - `en-US`: English language, MM/DD/YYYY date format
  - `en-IL`: English language, DD/MM/YYYY date format
- `CycleSnapshot` stores historical data for how each cycle ended (not every balance change)

---

## API Design

### Authentication

| Endpoint             | Method | Body                                  | Response                      |
| -------------------- | ------ | ------------------------------------- | ----------------------------- |
| `/api/auth/register` | POST   | `{ username, displayName, password }` | `{ user, token, redirectTo }` |
| `/api/auth/login`    | POST   | `{ username, password }`              | `{ user, token, redirectTo }` |
| `/api/auth/logout`   | POST   | -                                     | `{ success }`                 |
| `/api/auth/me`       | GET    | -                                     | `{ user, workspaces[] }`      |

**Login Response `redirectTo`:**

- If user has `mainWorkspaceId` set → redirect to that workspace
- Else if user owns a workspace → redirect to owned workspace
- Else → redirect to `/workspaces` (workspace selector)

### User

| Endpoint    | Method | Body                                          | Response      |
| ----------- | ------ | --------------------------------------------- | ------------- |
| `/api/user` | PATCH  | `{ displayName?, locale?, mainWorkspaceId? }` | `{ user }`    |
| `/api/user` | DELETE | `{ password }` (confirmation)                 | `{ success }` |

**Delete Account:**

- Requires password confirmation
- Deletes user and all owned workspaces (cascades to items, members, snapshots)
- Removes user from all workspaces they were a member of

### Workspace

| Endpoint                                 | Method | Body                         | Response                                    |
| ---------------------------------------- | ------ | ---------------------------- | ------------------------------------------- |
| `/api/workspace`                         | GET    | -                            | `{ workspaces[] }` (with role, memberCount) |
| `/api/workspace`                         | POST   | `{ name }`                   | `{ workspace }`                             |
| `/api/workspace/[id]`                    | GET    | -                            | `{ workspace, items[], memberCount }`       |
| `/api/workspace/[id]`                    | PATCH  | `{ name?, currentBalance? }` | `{ workspace }`                             |
| `/api/workspace/[id]/reset`              | POST   | -                            | `{ success }`                               |
| `/api/workspace/[id]/members`            | GET    | -                            | `{ members[] }`                             |
| `/api/workspace/[id]/members`            | POST   | `{ username, role }`         | `{ member }`                                |
| `/api/workspace/[id]/members/[memberId]` | PATCH  | `{ role }`                   | `{ member }`                                |
| `/api/workspace/[id]/members/[memberId]` | DELETE | -                            | `{ success }`                               |
| `/api/workspace/[id]/snapshots`          | GET    | -                            | `{ snapshots[] }`                           |

**Notes:**

- No DELETE for workspace - use "Reset Workspace" or "Delete Account" instead
- Reset workspace: clears all items, resets balance to 0, keeps members and snapshots
- Workspace GET returns `memberCount` instead of full member list (privacy, focus on balance)
- Link to "Manage Members" page for full member management

### Recurring Items

| Endpoint          | Method | Body                                                         | Response      |
| ----------------- | ------ | ------------------------------------------------------------ | ------------- |
| `/api/items`      | GET    | `?workspaceId=`                                              | `{ items[] }` |
| `/api/items`      | POST   | `{ workspaceId, type, category, label, amount, dayOfMonth }` | `{ item }`    |
| `/api/items/[id]` | PATCH  | `{ label?, amount?, dayOfMonth?, category? }`                | `{ item }`    |
| `/api/items/[id]` | DELETE | -                                                            | `{ success }` |

---

## Core Logic: Cycle Calculation

This is the most complex part of the app. The cycle is dynamically calculated based on recurring items.

### Algorithm

```typescript
interface CycleInfo {
  startDate: Date;
  endDate: Date;
  salaryDate: Date;
  lastExpenseBeforeSalary: Date;
  daysInCycle: number;
}

function calculateCycle(items: RecurringItem[], today: Date): CycleInfo {
  // 1. Find all salary items (income)
  const salaries = items.filter(i => i.type === 'INCOME');
  const expenses = items.filter(i => i.type === 'EXPENSE');

  // 2. Find the next salary date from today
  const nextSalaryDate = findNextOccurrence(salaries, today);

  // 3. Find the last expense BEFORE that salary
  const expensesBeforeSalary = expenses.filter(e =>
    e.dayOfMonth < nextSalaryDate.getDate() ||
    (next salary is in different month logic)
  );
  const lastExpenseDay = Math.max(...expensesBeforeSalary.map(e => e.dayOfMonth));

  // 4. Cycle ends the day AFTER the last expense
  const cycleEndDate = lastExpenseDay + 1;

  // 5. Cycle starts the day after the previous cycle ended
  // (which means day after previous month's last expense before salary)

  return { startDate, endDate, ... };
}
```

### Timeline Data Structure

```typescript
interface TimelineDay {
  date: Date;
  dayOfMonth: number;
  isToday: boolean;
  isPast: boolean;
  items: {
    id: string;
    label: string;
    amount: number;
    type: 'EXPENSE' | 'INCOME';
    category: ItemCategory;
  }[];
  runningBalance: number; // Calculated balance at end of this day
}

function generateTimeline(
  items: RecurringItem[],
  currentBalance: number,
  cycle: CycleInfo
): TimelineDay[] {
  // Generate array of days from cycle start to cycle end
  // Place items on their respective days
  // Calculate running balance for each day
}
```

---

## Feature Implementation

### 1. Authentication & Login Flow

**Registration Flow:**

1. User submits username, displayName, password
2. Server validates uniqueness of username
3. Password hashed with bcrypt (12 rounds)
4. User created in DB (locale defaults to "he-IL")
5. **Auto-create workspace** named "{displayName}'s Budget"
6. JWT token generated and returned
7. Token stored in httpOnly cookie
8. Redirect to dashboard (empty state with CTAs to add salary/expenses)

**Login Flow:**

1. User submits username, password
2. Server fetches user by username
3. bcrypt.compare() validates password
4. JWT token generated and returned
5. Token stored in httpOnly cookie
6. **Redirect logic:**
   - If `mainWorkspaceId` is set → go to that workspace
   - Else if user owns a workspace → go to owned workspace
   - Else → go to `/workspaces` page

**Session Management:**

- JWT contains: `{ userId, username, iat, exp }`
- Token expiry: 7 days
- Middleware checks token on protected routes
- Refresh: new token issued on each request

### 2. Workspace Management

**Workspace Creation:**

- Auto-created on registration (reduces friction)
- Users who only join others' workspaces don't need their own
- Each user can own **one** workspace

**User can access multiple workspaces:**

- One workspace they **own** (auto-created on registration)
- Multiple workspaces as **member** or **viewer** (invited by others)

**Workspace Switcher UI:**

```
┌──────────────────────────────────────┐
│  My Workspaces                       │
├──────────────────────────────────────┤
│  ★ Family Budget          owner      │  ← main workspace (starred)
│    Work Expenses          member     │
│    Parents' Budget        viewer     │
└──────────────────────────────────────┘
```

**Setting Main Workspace:**

- User can click star icon to set any workspace as "main"
- Only one workspace can be main
- Main workspace is where user lands after login
- Useful for household members who primarily use a shared workspace

**Workspace Actions:**

- **Reset Workspace**: Clears all items, sets balance to 0, keeps members and history
- **No Delete**: Workspaces cannot be deleted (use "Delete Account" to remove everything)

**Workspace List Response:**

```typescript
interface WorkspaceWithRole {
  id: string;
  name: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
  isMain: boolean; // true if this is user's mainWorkspaceId
  memberCount: number; // number of members (not full list)
}
```

### 3. Dashboard (Main Page)

**Components:**

```
┌─────────────────────────────────────────────────────────┐
│  [Workspace ▼]  Family Budget            [User Menu ▼]  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Current     │ │ Expected    │ │ Deficit/    │       │
│  │ Balance     │ │ End Balance │ │ Excess      │       │
│  │ [Editable]  │ │ ₪12,450     │ │ +₪2,100     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────┤
│  Cycle Timeline (ends Feb 16)                           │
│  ○───●───○───○───●───○───▼───○───●───○                  │
│  16  17  18  19  20  21  22  23  24  25                 │
│                      ↑ today                            │
├─────────────────────────────────────────────────────────┤
│  Upcoming Items                                         │
│  ┌─────────────────────────────────────────┐           │
│  │ 24 Jan  Credit Card    ₪3,200  [Edit]  │           │
│  │ 28 Jan  Rent           ₪4,500          │           │
│  │ 1 Feb   Salary         +₪15,000        │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

**Empty State (no items yet):**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│     Welcome! Let's set up your payment cycle.           │
│                                                         │
│     ┌─────────────────────────────────────┐            │
│     │  💰 Add your salary                  │            │
│     │  When do you get paid each month?   │            │
│     │  [+ Add Salary]                      │            │
│     └─────────────────────────────────────┘            │
│                                                         │
│     ┌─────────────────────────────────────┐            │
│     │  📋 Add your expenses                │            │
│     │  Rent, loans, credit card...        │            │
│     │  [+ Add Expense]                     │            │
│     └─────────────────────────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data Fetching:**

- Single API call: `GET /api/workspace/[id]` returns workspace + items
- Client calculates cycle, timeline, summaries from items
- React Query caches and manages refetching

**Balance Update:**

- Inline editable field
- Debounced API call (500ms)
- Optimistic update with rollback on error

### 4. Recurring Items Management

**Item Form Fields:**

- Type: Radio (Expense / Income)
- Category: Select dropdown
- Label: Text input
- Amount: Number input (displayed as currency, stored as cents)
- Day of Month: Number input (1-28) with validation

**Item List:**

- Grouped by type (Expenses / Income)
- Sorted by day of month
- Each item shows: category icon, label, amount, day
- Edit button opens modal/drawer with form
- Delete button with confirmation

**Validation (Zod):**

```typescript
const itemSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  category: z.enum(['LOAN', 'CREDIT_CARD', 'RENT', 'DAYCARE', 'OTHER', 'SALARY']),
  label: z.string().min(1).max(50),
  amount: z.number().positive().int(), // cents
  dayOfMonth: z.number().int().min(1).max(28),
});
```

### 5. Workspace Sharing

**Invite Flow:**

1. Owner/Member enters username to invite
2. Server validates user exists
3. Server checks inviter has permission (owner for members, owner/member for viewers)
4. WorkspaceMember created with appropriate role
5. Invited user sees workspace in their list on next login

**Permission Checks:**

```typescript
function canInvite(userRole: Role, targetRole: Role): boolean {
  if (targetRole === 'MEMBER') return userRole === 'OWNER';
  if (targetRole === 'VIEWER') return userRole !== 'VIEWER';
  return false;
}

function canEdit(userRole: Role): boolean {
  return userRole === 'OWNER' || userRole === 'MEMBER';
}

function canRemoveMember(userRole: Role, targetRole: Role): boolean {
  if (userRole === 'VIEWER') return false;
  if (userRole === 'MEMBER') return targetRole !== 'OWNER';
  return true; // Owner can remove anyone
}
```

### 6. Cycle Timeline Component

**Visual Design:**

- Horizontal scrollable timeline
- Each day is a node (circle)
- Nodes with items are larger/colored
- Red for expenses, green for income
- Today marker (arrow or highlight)
- **Auto-scrolls to today on load**
- Hover/tap shows popover with day details

**Implementation:**

```typescript
// Generate timeline data
const timeline = useMemo(() => {
  return generateTimeline(items, currentBalance, cycle);
}, [items, currentBalance, cycle]);

// Auto-scroll to today
const timelineRef = useRef<HTMLDivElement>(null);
const todayRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
}, [timeline]);

// Component renders SVG or div-based timeline
<Timeline ref={timelineRef}>
  {timeline.map(day => (
    <TimelineNode
      key={day.date}
      ref={day.isToday ? todayRef : null}
      {...day}
      onClick={() => setSelectedDay(day)}
    />
  ))}
</Timeline>
```

### 7. Cycle History (Snapshots)

**Purpose:**
Track how each cycle ended for historical reference. Not every balance change is recorded - only a snapshot when a cycle completes.

**When to Create Snapshot:**

- Automatically when a new cycle begins (snapshot the previous cycle)
- Triggered when salary is received (cycle end detected)
- Can be manually triggered by user ("Close Cycle")

**Snapshot Contains:**

```typescript
interface CycleSnapshot {
  cycleStartDate: Date;
  cycleEndDate: Date;
  startBalance: number; // Balance when cycle started
  endBalance: number; // Actual balance at cycle end
  totalIncome: number; // Sum of all income items
  totalExpenses: number; // Sum of all expense items
  expectedEnd: number; // What we predicted (startBalance + income - expenses)
  itemsSnapshot: ItemSnapshot[]; // Copy of items at that time
}

interface ItemSnapshot {
  label: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  category: string;
  dayOfMonth: number;
}
```

**History View:**

- Accessible from Settings or a "History" tab
- Shows list of past cycles with key metrics
- Can expand to see details of each cycle
- Useful for spotting patterns (e.g., credit card keeps growing)

**Snapshot Creation Logic:**

```typescript
async function createCycleSnapshot(workspaceId: string, cycle: CycleInfo) {
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
      cycleStartDate: cycle.startDate,
      cycleEndDate: cycle.endDate,
      startBalance: cycle.startBalance, // Need to track this
      endBalance: workspace.currentBalance,
      totalIncome,
      totalExpenses,
      expectedEnd: cycle.startBalance + totalIncome - totalExpenses,
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

---

## Internationalization (i18n)

### Setup

Using `next-intl` for Next.js App Router:

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'he'],
  defaultLocale: 'en',
});
```

### RTL Support

```typescript
// app/[locale]/layout.tsx
export default function LocaleLayout({ children, params: { locale } }) {
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={dir === 'rtl' ? 'font-hebrew' : ''}>
        {children}
      </body>
    </html>
  );
}
```

### Translation Files

```json
// messages/en.json
{
  "dashboard": {
    "currentBalance": "Current Balance",
    "expectedEndBalance": "Expected End Balance",
    "deficitExcess": "Deficit / Excess",
    "cycleEnds": "Cycle ends {date}",
    "upcoming": "Upcoming"
  },
  "items": {
    "addSalary": "Add Salary",
    "addExpense": "Add Expense",
    "categories": {
      "loan": "Loan",
      "credit_card": "Credit Card",
      "rent": "Rent",
      "daycare": "Daycare",
      "other": "Other",
      "salary": "Salary"
    }
  },
  "empty": {
    "welcome": "Welcome! Let's set up your payment cycle.",
    "addSalaryPrompt": "When do you get paid each month?",
    "addExpensePrompt": "Rent, loans, credit card..."
  }
}
```

```json
// messages/he.json
{
  "dashboard": {
    "currentBalance": "יתרה נוכחית",
    "expectedEndBalance": "יתרה צפויה בסוף",
    "deficitExcess": "גירעון / עודף",
    "cycleEnds": "המחזור מסתיים ב-{date}",
    "upcoming": "קרוב"
  },
  "items": {
    "addSalary": "הוסף משכורת",
    "addExpense": "הוסף הוצאה",
    "categories": {
      "loan": "הלוואה",
      "credit_card": "כרטיס אשראי",
      "rent": "שכירות",
      "daycare": "מעון",
      "other": "אחר",
      "salary": "משכורת"
    }
  },
  "empty": {
    "welcome": "!ברוכים הבאים! בואו נגדיר את מחזור התשלומים שלכם",
    "addSalaryPrompt": "מתי אתם מקבלים משכורת?",
    "addExpensePrompt": "שכירות, הלוואות, כרטיס אשראי..."
  }
}
```

### Currency Formatting

```typescript
// lib/currency.ts
export function formatCurrency(
  amount: number, // in cents
  currency: string = 'ILS',
  locale: string = 'he-IL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

// Examples:
// formatCurrency(1250000, 'ILS', 'en-US') → "₪12,500"
// formatCurrency(1250000, 'ILS', 'he-IL') → "12,500 ₪"
```

### Date Formatting

```typescript
// lib/date.ts
export function formatDate(date: Date, locale: string = 'he-IL'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Examples:
// formatDate(new Date('2024-01-15'), 'he-IL') → "15/01/2024" (DD/MM/YYYY)
// formatDate(new Date('2024-01-15'), 'en-US') → "01/15/2024" (MM/DD/YYYY)
// formatDate(new Date('2024-01-15'), 'en-IL') → "15/01/2024" (DD/MM/YYYY)
```

### Locale Switcher

- Located in user menu dropdown (Settings)
- Options: Hebrew (Israel), English (Israel), English (US)
- Changes user's `locale` preference in DB
- Affects: language, date format, currency position
- Redirects to same page with new locale

### 8. Settings Page

**User Settings:**

- Display name
- Locale (Hebrew IL / English IL / English US)
- Change password
- **Delete Account** (danger zone, requires password confirmation)

**Workspace Settings (Owner/Member only):**

- Workspace name
- **Manage Members** link (shows member count: "3 members")
- **Reset Workspace** (clears items and balance, keeps members)
- View cycle history

**Delete Account Flow:**

1. User clicks "Delete Account" in danger zone
2. Modal appears with warning about data loss
3. User must enter password to confirm
4. All owned workspaces deleted (cascade)
5. User removed from all member/viewer positions
6. User logged out and redirected to landing page

**Reset Workspace Flow:**

1. Owner clicks "Reset Workspace"
2. Confirmation modal explains what will be cleared
3. On confirm: delete all items, set balance to 0
4. Members and snapshots preserved
5. User sees empty state with CTAs

---

## UI Components (shadcn/ui)

Components to install:

- `button`, `input`, `label` - Forms
- `card` - Summary cards
- `dialog` - Modals for forms
- `dropdown-menu` - User menu, workspace switcher, actions
- `select` - Category selection
- `toast` - Notifications
- `tooltip` - Timeline hovers
- `popover` - Day details
- `badge` - Role indicators (owner, member, viewer)

---

## Security Considerations

1. **Password Storage**: bcrypt with cost factor 12
2. **JWT**: Stored in httpOnly cookie, not localStorage
3. **CSRF**: SameSite=Strict cookie attribute
4. **Input Validation**: Zod on all endpoints
5. **Authorization**: Check user role on every mutating endpoint
6. **Rate Limiting**: Consider adding on auth endpoints (can use Vercel Edge Config or upstash)

---

## Error Handling

**API Errors:**

```typescript
// Consistent error response format
interface ApiError {
  error: string;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'SERVER';
  details?: Record<string, string>; // Field-level errors
}
```

**Client Handling:**

- React Query `onError` callbacks
- Toast notifications for user feedback
- Form field errors displayed inline

---

## Development Phases

**Phase 1: Foundation**

- [ ] Project setup (Next.js, Prisma, Tailwind, next-intl)
- [ ] Database schema and migrations (including CycleSnapshot)
- [ ] Auth endpoints and middleware
- [ ] i18n setup with he-IL/en-IL/en-US locales
- [ ] Auto-create workspace on registration

**Phase 2: Core Features**

- [ ] Workspace CRUD (no delete, add reset)
- [ ] Recurring items CRUD
- [ ] Cycle calculation logic
- [ ] Date/currency formatting with locale support

**Phase 3: Dashboard**

- [ ] Summary cards
- [ ] Timeline component (with auto-scroll to today)
- [ ] Upcoming items list
- [ ] Empty state with CTAs

**Phase 4: Multi-Workspace**

- [ ] Workspace list page (with member count)
- [ ] Workspace switcher component
- [ ] Main workspace flag
- [ ] Login redirect logic

**Phase 5: Collaboration**

- [ ] Member management (separate page)
- [ ] Permission enforcement
- [ ] Settings page (user + workspace)

**Phase 6: History & Account**

- [ ] Cycle snapshot creation (automatic on cycle end)
- [ ] Cycle history view
- [ ] Reset workspace feature
- [ ] Delete account feature

**Phase 7: Polish**

- [ ] Mobile responsiveness
- [ ] RTL layout testing
- [ ] Loading states
- [ ] Error handling
- [ ] Edge cases
