# Agent Workflow for the Workspace Monorepo

This document outlines the expected workflow for AI agents interacting with and managing the `workspace` monorepo. The goal is to ensure consistent, efficient, and high-quality task execution.

## Core Principles

- **Context-Awareness**: Always leverage the provided documentation (`ai/docs`), project structure, and existing code patterns.
- **Proactive Problem Solving**: Anticipate issues, provide clear explanations, and seek clarification when necessary.
- **Quality First**: Prioritize code quality, adherence to standards, and robust testing.
- **Transparency**: Clearly communicate actions, plans, and results.

## Workflow Steps

### 0. Task Initialization

- **Load Task**: Upon receiving a task, the agent will expect a corresponding task definition file at `ai/tasks/{task-name}_task.md`. This file will contain the detailed instructions for the task.
- **Initialize Progress**: Create an empty `ai/tasks/{task-name}_progress.md` file to log continuous progress.

### 1. Understand the Request

- **Analyze**: Carefully read and understand the user's request. Identify the core objective, scope, and any explicit constraints or preferences.
- **Consult Documentation**: Refer to `ai/docs/overview.md`, `ai/docs/coding-standards.md`, and `ai/docs/architectural-constraints.md` to ensure full comprehension of the monorepo's conventions, technologies, and rules.
- **Inspect Codebase**: Use available tools (e.g., `list_directory`, `read_file`, `search_file_content`, `glob`) to examine relevant files, project structure, dependencies, and existing implementations. Pay close attention to `package.json`, `pnpm-workspace.yaml`, `turbo.json`, and `tsconfig.json`.
- **Clarify**: If the request is ambiguous or lacks sufficient detail, ask clarifying questions to the user.

### 2. Plan the Solution

- **Outline Steps**: Break down complex tasks into smaller, manageable subtasks. Use a `write_todos` list to track progress and communicate the plan.
- **Identify Tools**: Determine which tools (e.g., `write_file`, `replace`, `run_shell_command`, `codebase_investigator`) are necessary for each subtask.
- **Adhere to Conventions**: Ensure the plan aligns with the monorepo's established coding standards, architectural constraints, and project structure (e.g., package naming, template usage).
- **Test Strategy**: Formulate a testing strategy, including identifying where to add new tests or modify existing ones.

### 3. Implement the Solution

- **Scaffolding**: If creating a new application, use the appropriate template from `/templates` and scaffold it into `/apps`.
- **Code Generation/Modification**: Write or modify code following the project's coding standards (`ai/docs/coding-standards.md`).
- **Dependency Management**: Use `pnpm` for adding, removing, or updating dependencies.
- **Turborepo Configuration**: If adding new tasks or optimizing existing ones, update `turbo.json` with correct `dependsOn` relationships.
- **Atomic Changes**: Prefer smaller, focused changes.

### Progress Tracking

- **Update Progress**: Regularly update `ai/tasks/{task-name}_progress.md` with details of actions taken, progress made, and any challenges encountered. This ensures continuity and transparency.

### 4. Verify the Changes

- **Unit/Integration Tests**: Run existing tests or execute newly created tests to verify the correctness of the implementation. Identify test commands by examining `package.json` scripts or `vitest.config.ts`.
- **Build & Lint**: Execute the project's build, linting, and type-checking commands (e.g., `pnpm build`, `pnpm lint`, `pnpm typecheck`) to ensure code quality and adherence to standards.
- **Review**: Perform a self-review of the implemented changes against the initial request and the plan.

### 5. Finalize and Report

- **Confirm Completion**: Ensure all subtasks are marked as complete.
- **Generate Summary**: Create `ai/tasks/{task-name}_summary.md` summarizing the work done, key decisions, and outcomes.
- **Clean Up**: Delete the `ai/tasks/{task-name}_task.md` and `ai/tasks/{task-name}_progress.md` files.
- **Await Next Instruction**: Indicate readiness for the next task.

## Global Skills (Executable Capabilities)

AI agents can leverage the following operational workflows:

### A. Testing

- **Run tests for a specific app or package**: `pnpm run test:<name>`

- **Frameworks**: Vitest for unit tests and Playwright for E2E.

### B. Development (Local Execution)

- **Launch apps**: `pnpm run dev:<app-name>`

- **Launch templates**: `pnpm run dev:template:<template-name>`

- **Production environment variables locally**: Use the Railway CLI (`railway run`) when needed.

### C. Build Operations

- **App Build**: `pnpm run build:<app-name>`

- **Global Build**: `pnpm run build` (via Turborepo) to build the entire workspace graph.

### D. Lint & Format

- **Execute workspace-wide linting/formatting**: `pnpm run lint` and `pnpm run format`

### E. Create from Template (The "Scaffolder")

- **Workflow**: Do not simply copy-paste.

- **Action**:
  1.  Copy core files from `/templates/<tier>`.

  2.  Update `package.json` names and dependencies.

  3.  Update root `tsconfig.json` or workspace configs to recognize the new app.

  4.  Inject necessary scripts into the local `package.json`.

  5.  Run `pnpm install` and `pnpm run build:<new-app>` to verify the graph.
  - (See `ai/skills/scaffolder.md` for more details.)

### F. Smart Commit & Push

- **Workflow**: Use "Conventional Commits" (e.g., `feat:`, `fix:`, `chore:`).

- **Rule**: Summarize the commit message based on the **Chat Context** only.

- **Constraint**: DO NOT read the physical files to generate the message (to avoid context/token overload). Summarize what was _discussed_ doing.

- **Action**: Execute `git add .`, `git commit -m "..."`, and `git push`.

### G. Standalone Export (The "Assignment" Skill)

- **Action**: Use `pnpm deploy` to flatten a specific app from `/apps` into an isolated folder.

- **Details**: Ensure all internal `@workspace` packages are bundled. Initialize a fresh Git repo and a `docker-compose.yml` in the exported folder.

- (See `ai/skills/exporter.md` for more details.)

## Documentation (The "Chronicler" Section)

- **Responsibility**: Every major structural change or new app creation must be documented under `ai/docs/`.

- **Structure**: Maintain `ai/docs/WORKSPACE_MAP.md` that lists all current apps, their status, and their tier.

- **Prisma Updates**: If the schema changes, update `ai/docs/database.md` to reflect the new ERD (Entity Relationship Diagram).

## Deployment Note (Railway)

- All apps are deployed to Railway.

- Routing is subdomain-based.

- Production URLs follow the pattern: `https://<app-name>.yourdomain.com`.

By following this workflow, agents can effectively contribute to the development and maintenance of the `workspace` monorepo.
