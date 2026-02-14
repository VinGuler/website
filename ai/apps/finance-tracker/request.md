# Finance Tracker

## 0. Philosophy

Many humans live in a constant deficit, simply because they are not thinking right about their finance. When you have a steady recurring income ("salary"), and steady expected payments - you need a place to see how much money you can actually spend. This app is not automatic (we're not pulling any data), it is about training this muscle, to know how your cycle this month is gonna end, and adjust expenses accordingly.

## 1. Objective

Implement the Finance Tracker app.

## 2. Context & Background

The Finance Tracker app is a web app designed to provide users visibility into their financial monthly cycle.

### 2.1 Definitions

_Monthly Cycle_: A monthly financial cycle goes from the day of the first salary of the month, until the day after the last recurring payment of the month. For example, if salary is received each month on the 10th and another salary on the 12th, and a credit card payment on the 15th and there's a loan payment on the 20th, and then no more recurring payments till the next 10th -> the cycle is defined from the 10th to the 21st.

_Salary_: A recurring income. Usually there would be 1 or 2 of these.

_Balance_: The amount of money the users now have in the bank.

_Recurring Payments_: Payments the are made on a specific day of the month, and are visible in apps for the users. A load payment is a <b>stable</b> recurring payment, meaning the payment is roughly the same on the same day of each month. A credit card payment is a <b>dynamic</b> recurring payment, because it is being payed on the same day of the month, yet it changes based on expenses.

_Deficit_: If recurring payments are higher then the salary, user is in deficit by the end of the monthly cycle.

_Excess_: If recurring payments are lower then the salary, user is in excess by the end of the monthly cycle.

## 3. Scope

### In-Scope

- User creation (registration) and authentication
  - User creation with username, display name and password
  - Validation for "user exists" error - username should be unique
  - Authentication using username and password
  - Session control (re-opening the browser should keep the user in session)
- User workspace (main panel):
  - Created when user is created
  - UI/UX Flow: Balance details should appear in cards at the top, display all the upcoming stuff (payment and salary) in a card list under. Each card should have delete and update actions. A Call to Action (CTA) to add an item should be present between the list and the balance cards.
  - Workspace states:
    - **Empty state**: No items configured yet. The workspace should guide the user to add their first salary or recurring payment (e.g., a friendly prompt or illustration with a CTA).
    - **Active cycle state**: The normal view — balance cards at top, upcoming items listed below, calculations active.
    - **Between-cycles state**: All items for the current cycle have been marked as paid/received, and the next cycle hasn't started yet. The workspace should show a summary of the completed cycle (final balance, total deficit/excess) and indicate when the next cycle begins.
  - Current Balance (editable)
  - Expected Balance (non-editable, calculated based on data)
  - Expected Deficit/Excess (non-editable, calculated based on data)
  - Upcoming recurring payments
  - Upcoming salary
  - Actions to:
    - reset the workspace (clears all associated salaries and recurring payments, sets Balance to 0)
    - add a recurring payment or salary
    - updated a recurring payment or salary
    - delete a recurring payment or salary
- User sharing management (another panel / screen)
  - Workspaces can be shared between users. The search for users to share with should be exact (search by username only) to ensure clarity and prevent spamming/listing all users.
  - User can view workspaces links where they are members or viewers
  - User can "exit" themselves from a workspace (unless it is their own workspace, where they are owners)
  - Workspaces can be shared between users with these permissions:
    - Owner: Creator of the workspace. Can add or remove members and viewers, can assign another member or viewer as the owner, allowed all actions.
    - Member: A member of the workspace. Invited by owner only. Can add viewers and remove other members (but not the owner). Cannot add new members — this prevents workspace pollution, since members are typically the owner's partner or a temporary helper. The intent is that an owner adds a member for assistance, and that member can later clean up (remove other members) even if the owner is unavailable. Allowed all CRUD actions (updating data in the workspace).
    - Viewer: A viewer of the workspace. Invited by owner and members, cannot do anything on the workspace except view it
- Cycle history archiving (backend only, no UI for viewing historical data in MVP)

### Out-of-Scope

- Google authentication - to be added
- Workspace deletion
- Cycle history and statistics
- Captcha (not an MVP feature; to be considered before public release)

## 4. Requirements & Constraints

### 4.1 Data Model Considerations

Based on the discussion, here's a preliminary conceptual data model:

- **User**: { username (unique), displayName, password (hashed) }

- **WorkspaceToUser**: { userId, workspaceId, permission (Owner, Member, Viewer) } - defines user roles within a workspace.

- **Workspace**: { id, balance, cycleStartDate, cycleEndDate } - `cycleDefinition` can be made using an anchor date or similar mechanism (TBD).

- **Item**: { id, type (salary, income, credit-card, loan-payment, rent, other), label, amount, dayOfMonth, isPaid (boolean — marks whether the item has been paid/received for the current cycle), workspaceId }

- **CompletedCycles**: { id (UUID, PK), workspace_id (UUID, FK), cycle_label (String, auto-generated as "{Month} {Year}"), final_balance (Numeric), items_snapshot (JSONB), created_at (Timestamp) }

The `ItemToWorkspace` intermediate model is likely redundant; `workspaceId` can be directly associated with the `Item` model for simplicity.

### 4.2 Calculation Rules for Expected Balance and Deficit/Excess

**End of Cycle Balance Calculation**:
`Current Balance + [Sum of all upcoming salaries within the cycle] - [Sum of all upcoming payments within the cycle]`

**Expected Deficit/Excess Calculation (for the full cycle based on initial configuration, or remaining cycle based on current state)**:
`[Sum of all salaries within the cycle] - [Sum of all payments within the cycle]`
This value represents the net financial change expected over the cycle, irrespective of the current balance.

**Dynamic Updates (User-Driven Marking with Nudges)**:
Items are marked as paid/received **manually by the user** (Owner or Member). This aligns with the app's philosophy of training financial awareness — the user must consciously acknowledge each transaction.

When the user opens the workspace, the frontend should highlight items whose `dayOfMonth` has passed but are not yet marked as `isPaid`. These are shown as **overdue nudges** (e.g., visual emphasis, a badge, or a prompt) to remind the user to confirm them.

When the user marks an item as paid/received:

1.  Set the `Item.isPaid` flag to `true`.
2.  Adjust the `Workspace.balance` accordingly (subtract paid payments, add received salaries).
3.  Recalculate `Expected Balance` and `Expected Deficit/Excess` based on the _remaining_ unpaid items and the updated `Workspace.balance`.

**Detailed Example of Dynamic Update:**

1.  **Initial State**:
    - Workspace `balance`: `100`
    - Upcoming: `Loan Payment (100)`, `Credit Card Payment (100)`, `Salary (500)`
    - **Expected End of Cycle Balance**: `100 + 500 - 100 - 100 = 400`
    - **Expected Deficit/Excess (initial)**: `500 - 100 - 100 = (+)300`
2.  **Loan Payment Day Passes — User Marks as Paid**:
    - Loan Payment's `dayOfMonth` has passed; it appears highlighted as overdue.
    - User confirms the payment — `isPaid` is set to `true`.
    - Backend updates Workspace `balance`: `100 - 100 = 0`.
    - User sees:
      - Workspace `balance`: `0`
      - Remaining Upcoming: `Credit Card Payment (100)`, `Salary (500)`
      - **Recalculated Expected End of Cycle Balance**: `0 + 500 - 100 = 400`
      - **Recalculated Expected Deficit/Excess (remaining cycle)**: `500 - 100 = (+)400`
3.  **User Updates Credit Card Payment**:
    - User updates `Credit Card Payment` to `120`.
    - Backend saves update and recalculates workspace values for the current cycle.
    - User sees:
      - Workspace `balance`: `0`
      - Remaining Upcoming: `Credit Card Payment (120)`, `Salary (500)`
      - **Recalculated Expected End of Cycle Balance**: `0 + 500 - 120 = 380`
      - **Recalculated Expected Deficit/Excess (remaining cycle)**: `500 - 120 = (+)380`

Calculations should be made in both the frontend and backend for consistency and immediate feedback.

### Functional Requirements

- Privacy first - we don't want any private information about users. no phones, no emails, no payment methods.

### Non-Functional Requirements

- Passwords must be hashed using bcrypt with a configurable salt rounds (default 10).

### Technical Constraints

## 5. Acceptance Criteria

- The new `finance-tracker` app is scaffolded in `apps/`, builds successfully (`pnpm build --filter=finance-tracker`), and starts in development mode (`pnpm dev --filter=finance-tracker`).
- The new `finance-tracker` app should have some sanity tests in frontend and backend,
- User is able to register, login and logout.
- Upon login, user should be able to view their workspace
- When viewing the workspace, users should be able to add recurring payments and salary (day of payment/salary and sum)
- User should be able to update current bank balance.
- Calculation for excess/deficit and cycle end balance should work as expected
- User should be able to share workspace with other users (search by username only)
- User should be able to view in a list all the workspaces that were shared with them (there should be an action available for the user to remove the sharing)
- User should be able to go a shared workspace
- User should be able to go back to the workspace they own

## 6. Suggested Implementation Notes (Optional)

[If there are any initial thoughts, ideas, or specific approaches that could guide the implementation, list them here. This section is not binding but can provide a starting point and help align the agent's approach.]

- Use the client-server-database template - a database is required.
- Leverage the `@workspace/database` package for Prisma client access.
- For JWT handling, the `jsonwebtoken` library could be used.
- The frontend should be built using Vue 3 + Vite, consistent with the template.
- The cycle_label for `CompletedCycles` should be automatically generated as "{Month} {Year}" based on the archived cycle's `startDate`.
- One-off items are not part of the MVP; only recurring, dynamic, and static items are considered.
- For the MVP, there will be no UI for viewing historical cycle data. The archiving feature is backend and database-only, triggered by user login/workspace fetch.
- When a cycle transition and archiving occurs, the UI should indicate a loading state to manage potential delays gracefully.

## 7. Decided Design Details

### 7.1 Cycle Auto-Roll and the Paid/Received Lifecycle

Items are recurring by nature — they repeat every month on the same `dayOfMonth`. The `isPaid` flag tracks whether an item has been fulfilled **in the current cycle only**. When the cycle ends and a new one begins, all items reset to `isPaid: false` so they appear as upcoming again.

**Cycle Transition Logic:**

1. **During an active cycle**: Items start with `isPaid: false`. As their day passes, they get highlighted as overdue. The user manually marks them as paid/received, which updates the balance and recalculates projections. Paid items remain visible (greyed out / checked off) for the rest of the cycle so the user can see the full picture.

2. **Between-cycles state**: Once all items are marked as paid/received and the cycle end date passes, the workspace enters the between-cycles state. It shows a summary of the completed cycle and a countdown or indicator for when the next cycle starts.

3. **New cycle begins**: Cycle transition is **automatic**. There is no manual "Start New Cycle" action — the cycle is defined by the items themselves and starts when the first salary day arrives. There is no meaning in manually starting it.

**Cycle Reset Mechanism & Archiving — On-Login Side Effect (No Scheduler):**

The `isPaid` reset and historical archiving are implemented as a **backend side effect when the user loads the workspace**, not via a background scheduler or cron job. The flow:

1.  User opens app → frontend shows loading state.

2.  Backend receives the "get workspace" request → checks if today's date is past the previous cycle's end and into a new cycle's start.

3.  **Concurrency Control**: Use a Postgres Transaction with `SELECT ... FOR UPDATE` on the workspace row. This ensures that in a shared workspace, only the first user to log in triggers the archive, preventing duplicate history entries.

4.  **Archive Previous Cycle (if applicable)**:
    - If a new cycle has started, serialize the current `Item` records (including `isPaid` state) into a JSONB `items_snapshot`.

    - Create a new record in the `CompletedCycles` table, storing `workspace_id`, a `cycle_label` (e.g., "January 2026"), the `final_balance` at the moment of archiving, and the `items_snapshot`.

5.  **Reset for New Cycle**:
    - Update `workspace.cycle_end_date` to the next period.
      - Bulk update all recurring items: `paid = false`.

    - Keep `Workspace.balance` as-is (it represents the real bank balance).

6.  Backend returns the fresh workspace state.

7.  Frontend renders the new active cycle.

If a user hasn't opened the app for multiple months, the side effect should land them in the **current** cycle correctly — a single archive and reset to `isPaid: false` handles this regardless of how many cycles were missed, since balance is manually managed and items are recurring with a fixed `dayOfMonth`.
