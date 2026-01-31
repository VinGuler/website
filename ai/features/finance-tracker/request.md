# Finance Tracker App

## Overview

A personal finance awareness app that helps users understand their monthly cash flow. It replaces a manual Google Sheets workflow where users track expected expenses, income (salaries), and calculate their expected bank balance at the end of each billing cycle.

**Philosophy**: This is not an automation tool or a budgeting/planning app. It's a training tool that helps users:

- Understand the concept of a payment cycle
- See clearly what's happening with their finances
- Build awareness of their cash flow patterns

The app requires manual updates - users are responsible for keeping their data accurate.

---

## Core Concepts

### Billing Cycle

A cycle is defined by income (salary) and expenses:

- **Cycle starts**: The day after the previous cycle ends
- **Cycle ends**: The day after the last recurring expense before the next salary

**Examples:**
| Salary Day | Last Expense Before Salary | Cycle Ends |
|------------|---------------------------|------------|
| 10th | Loan on 5th | 6th |
| 1st | Loan on 15th, Credit Card on 10th | 16th |
| 15th | Rent on 1st, Loan on 10th | 11th |

The app calculates and shows what the bank balance will be at cycle end.

### Recurring Items

Items that repeat every cycle, each with a specific day-of-month:

| Type    | Direction | Examples                          |
| ------- | --------- | --------------------------------- |
| Expense | Outgoing  | Rent, loans, credit card, daycare |
| Income  | Incoming  | Salary 1, Salary 2                |

### Expense Behavior

| Category      | Behavior                                                                      | Update Frequency                        |
| ------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| `loan`        | **Fixed** - Amount doesn't change unless major event (new loan, loan cleared) | Rarely                                  |
| `rent`        | **Fixed** - Stable amount                                                     | Rarely                                  |
| `daycare`     | **Fixed** - Stable amount                                                     | Rarely                                  |
| `credit_card` | **Dynamic** - "Grows" during cycle as purchases are made                      | Frequently (user updates as they spend) |
| `other`       | Depends on item                                                               | Varies                                  |

### Income Categories

- `salary` - Regular employment income

---

## Data Model

### User

```
- id: string
- username: string (unique, used for login)
- displayName: string
- passwordHash: string
```

**Privacy**: No email, phone, or other personal data collected.

### Workspace

A shared financial context (e.g., a household budget).

```
- id: string
- name: string
- currentBalance: number (user-updated bank balance)
- ownerId: string (User.id)
```

Note: Cycle end day is **calculated** from recurring items, not stored.

### WorkspaceMember

```
- workspaceId: string
- userId: string
- role: 'owner' | 'member' | 'viewer'
```

### Role Permissions

| Action                          | Owner | Member | Viewer |
| ------------------------------- | ----- | ------ | ------ |
| View dashboard                  | Yes   | Yes    | Yes    |
| Update current balance          | Yes   | Yes    | No     |
| Add/edit/delete recurring items | Yes   | Yes    | No     |
| Add members                     | Yes   | No     | No     |
| Remove members                  | Yes   | Yes    | No     |
| Add/remove viewers              | Yes   | Yes    | No     |
| Transfer ownership              | Yes   | No     | No     |

### RecurringItem

```
- id: string
- workspaceId: string
- type: 'expense' | 'income'
- category: 'loan' | 'credit_card' | 'rent' | 'daycare' | 'other' | 'salary'
- label: string (e.g., "Bank Loan A", "John's Salary")
- amount: number
- dayOfMonth: number (1-28)
```

---

## Calculated Values

For the current cycle:

| Field                   | Calculation                                    |
| ----------------------- | ---------------------------------------------- |
| Cycle End Date          | Day after last expense before next salary      |
| Total Expected Expenses | Sum of all expense items                       |
| Total Expected Income   | Sum of all income items                        |
| Expected End Balance    | `currentBalance + totalIncome - totalExpenses` |
| Cycle Deficit/Excess    | `totalIncome - totalExpenses`                  |

---

## User Interface

### Single-Page Dashboard

All information visible on one screen (responsive for mobile).

#### 1. Summary Cards (Top)

- **Current Balance**: Editable input showing today's bank balance
- **Expected End Balance**: Calculated balance at cycle end (with cycle end date shown)
- **Cycle Deficit/Excess**: Shows if user will be positive or negative (color-coded)

#### 2. Cycle Timeline (Middle)

A visual timeline from cycle start to cycle end:

- Each day is a point on the timeline
- Days with transactions are highlighted with markers
- Expense markers (red) and income markers (green)
- Hovering/tapping a marker shows the item details
- "Today" indicator on the timeline
- Shows running balance progression through the cycle

#### 3. Upcoming Items (Side/Below)

List of expenses and income sorted by upcoming date:

- Shows: date, label, amount, category icon
- Items that have already passed in this cycle are dimmed
- Quick-edit capability (especially useful for dynamic expenses like credit card)
- Visual indicator for dynamic vs fixed items

#### 4. Manage Recurring Items

- Add/edit/delete recurring expenses and income
- For each item: label, amount, day of month, category
- Sort by day of month

---

## Features

### Authentication

- Simple username + password login
- Registration with username, display name, password
- No email verification (privacy-first approach)
- Session-based or JWT authentication

### Workspace Sharing

- Owner can invite users by username as **members** or **viewers**
- Members have full edit access but cannot add new members
- Members can remove other members or manage viewers
- Viewers have read-only access
- Owner can transfer ownership to a member

### Settings

- Edit display name
- Change password
- Workspace name

---

## Technical Requirements

### Stack (Vercel-Compatible)

| Layer    | Technology                             | Rationale                                         |
| -------- | -------------------------------------- | ------------------------------------------------- |
| Frontend | React + TypeScript                     | Standard, good DX                                 |
| Styling  | Tailwind CSS                           | Fast styling, responsive                          |
| Backend  | Next.js API Routes                     | Integrated with frontend, Vercel-native           |
| Database | PostgreSQL (Vercel Postgres or Neon)   | Relational data, good for structured finance data |
| ORM      | Prisma or Drizzle                      | Type-safe database access                         |
| Auth     | Custom (bcrypt + sessions) or NextAuth | Simple, no OAuth needed                           |

### Deployment

- Vercel for hosting (frontend + API)
- Vercel Postgres or external PostgreSQL provider

### Security

- Passwords hashed with bcrypt
- HTTPS only
- Input validation on all endpoints
- Rate limiting on auth endpoints

---

## Out of Scope (v1)

- Transaction history / logs
- One-time expenses (reflected in balance updates instead)
- Bank account integration / automation
- Multiple currencies
- Recurring items with custom frequency (weekly, bi-weekly)
- Export/import functionality
- Mobile native app
- Future cycle projections

---

## User Flow

1. **New User**: Register → Create Workspace → Add salary (income) → Add recurring expenses → View dashboard
2. **Returning User**: Login → View dashboard → Update current balance → Update credit card amount if needed
3. **Household Setup**: Owner creates workspace → Invites partner as member → Both can manage finances
4. **Shared Viewer**: Receive invite as viewer → Login → View shared workspace (read-only)
