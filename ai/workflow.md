# Agent Workflow for the Workspace Monorepo

This document outlines the expected workflow for AI agents interacting with and managing the `workspace` monorepo. The goal is to ensure consistent, efficient, and high-quality task execution.

## Core Principles

- **Context-Awareness**: Always leverage the provided documentation (`ai/docs`), project structure, and existing code patterns.
- **Proactive Problem Solving**: Anticipate issues, provide clear explanations, and seek clarification when necessary.
- **Quality First**: Prioritize code quality, adherence to standards, and robust testing.
- **Transparency**: Clearly communicate actions, plans, and results.

## Workflow Steps

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

### 4. Verify the Changes

- **Unit/Integration Tests**: Run existing tests or execute newly created tests to verify the correctness of the implementation. Identify test commands by examining `package.json` scripts or `vitest.config.ts`.
- **Build & Lint**: Execute the project's build, linting, and type-checking commands (e.g., `pnpm build`, `pnpm lint`, `pnpm typecheck`) to ensure code quality and adherence to standards.
- **Review**: Perform a self-review of the implemented changes against the initial request and the plan.

### 5. Finalize and Report

- **Confirm Completion**: Ensure all subtasks are marked as complete.
- **Summarize (if requested)**: Provide a concise summary of the work done, especially for complex tasks.
- **Await Next Instruction**: Indicate readiness for the next task.

## Using AI Personas and Skills

- **Personas (`ai/personas`)**: When a specific expertise is required, the agent should internally or explicitly adopt the relevant persona to guide its reasoning and output.
- **Skills (`ai/skills`)**: Utilize documented skills (e.g., Exporter, Scaffolder) for automating complex, repetitive tasks. If a new skill is needed, propose its definition for inclusion in `ai/skills`.

By following this workflow, agents can effectively contribute to the development and maintenance of the `workspace` monorepo.
