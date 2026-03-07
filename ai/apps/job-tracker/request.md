# Job Tracker (ApplyFlow)

## 0. Philosophy

The job search process is a chaotic, multi-threaded journey. Every company has its own interview stages, making a simple Kanban board insufficient for capturing the internal complexity of a single application. Job Tracker (ApplyFlow) provides a "Global vs. Local" hybrid: a high-level overview for status across all leads and a customizable, linear "Stage Builder" within each ticket to track company-specific hurdles. The most important data point is "What is next?".

## 1. Objective

Implement the Job Tracker (ApplyFlow) app.

## 2. Context & Background

Job seekers managing multiple concurrent applications need a centralized system that bubbles up the current active stage of any application to the top-level card, solving the "static spreadsheet" problem with a dynamic, two-tier interface.

### 2.1 Definitions

_Application_: A single job pursuit at a specific company for a specific role.

_Global Status_: The high-level state of the application (Applied, In Progress, Offer, Rejected, Ghosted, Archived).

_Local Pipeline_: The sequence of stages/interviews for a specific application.

_Stage_: A single step in the local pipeline (e.g., HR Phone Screen, Home Assignment, Technical Interview).

_Next Step_: The first uncompleted stage in the local pipeline, displayed as a high-visibility badge on the Kanban card.

_Notes_: Markdown-supported feedback and question tracking for each stage.

## 3. Scope

### In-Scope

- User creation (registration) and authentication (consistent with the monorepo's shared auth pattern).
- User workspace (main panel):
  - Kanban board with standard columns: Applied, In Progress, Offer, Archived/Rejected.
  - "Company Cards" displaying: Company name, Role, and a high-visibility "Next Step" badge.
  - CRUD operations for applications (add/update/delete).
  - Search/Filter for applications by company or role.
- Application Detail View (Slide-over/Modal):
  - Dynamic Stage Manager: Add, reorder, and check off interview rounds.
  - Markdown-supported "Notes" for each stage.
  - Link to job posting, salary range, and company website.
- User sharing management (consistent with finance-tracker permissions: Owner, Member, Viewer).
  - Workspaces can be shared between users. Search for users by exact username only.
  - Shared workspace permissions (Owner, Member, Viewer) as defined in the platform standards.

### Out-of-Scope

- Automated job scraping from external boards.
- Resume/CV builder or storage.
- Email integration or calendar syncing.
- AI-generated interview preparation or feedback.

## 4. Requirements & Constraints

### 4.1 Data Model Considerations

- **User**: { username (unique), displayName, password (hashed) }
- **Workspace**: { id, name }
- **WorkspaceToUser**: { userId, workspaceId, permission (Owner, Member, Viewer) }
- **Application**: { id, workspaceId, companyName, role, status (Global Status), salaryRange, jobLink, description, createdAt }
- **Stage**: { id, applicationId, label, order, isCompleted, notes (Markdown text), scheduledAt }

### 4.2 Logic for "Next Step"

The "Next Step" for an application is dynamically determined:

1. Find all `Stages` for the application where `isCompleted` is `false`.
2. Sort them by `order`.
3. The first stage in this sorted list is the "Next Step".
4. If all stages are completed, the "Next Step" displays a "Completed" or "Pending Decision" state.

### Functional Requirements

- **Minimal Friction**: Adding a company and defining a process should be as fast as typing a Slack message.
- **Privacy**: No sensitive private data like phone numbers or emails required.

### Non-Functional Requirements

- Passwords must be hashed using bcrypt.
- Markdown rendering for notes should be secure (sanitized).

### Technical Constraints

- **Frontend**: Vue 3 + Vite, TypeScript, Vanilla CSS (standard for the monorepo).
- **Backend**: Express 5, TypeScript.
- **Database**: Prisma (ORM) with PostgreSQL.
- **Shared Libraries**: Leverage `@workspace/database` and `@workspace/utils`.

## 5. Acceptance Criteria

- The new `job-tracker` app is scaffolded in `apps/`, builds successfully (`pnpm build --filter=job-tracker`), has successfully passing tests (`pnpm test --filter=job-tracker`), and starts in development mode (`pnpm dev --filter=job-tracker`).
- User can register, login, and logout.
- Upon login, user can view their Kanban board.
- User can create a new application card with company name and role.
- User can open an application to define its local pipeline (stages).
- The "Next Step" badge correctly reflects the first uncompleted stage on the Kanban card.
- User can add/edit Markdown notes for each stage.
- Workspace sharing functionality works as expected (search by username).
- User can filter the Kanban board by company name or role.

## 6. Suggested Implementation Notes (Optional)

- Use the `client-server-database` template as the foundation.
- Implement a drag-and-drop interface for the Kanban board columns and stage reordering within the detail view.
- Ensure the "Next Step" logic is consistent between frontend (for immediate feedback) and backend (for data integrity).
- Consider using a slide-over component for the Application Detail View to maintain context with the Kanban board.
