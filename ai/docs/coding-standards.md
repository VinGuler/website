# Coding Standards

This document outlines the coding standards and practices enforced within the `workspace` monorepo to ensure consistency, quality, and maintainability across all projects.

## Language

- **TypeScript**: All new code must be written in TypeScript.
  - **Strict Mode**: TypeScript is configured to use strict mode (`tsconfig.json`), promoting robust and type-safe code.

## Formatting

- **Prettier**: Code formatting is handled automatically by Prettier. Developers should ensure their editors are configured to format files on save or run Prettier as a pre-commit hook.
  - Configuration: `.prettierrc` at the root of the workspace defines the formatting rules.

## Linting

- **ESLint**: ESLint is used to enforce code quality, identify problematic patterns, and maintain stylistic consistency.
  - Configuration: `eslint.config.js` at the root defines the linting rules using flat config (v9).
  - Pre-commit Hook: Husky runs ESLint checks as part of the pre-commit process.

## Module System

- **ES Modules**: The entire workspace is configured to use ES modules (`"type": "module"` in `package.json` where applicable).

## Testing

- **Vitest**: Used for unit and integration testing across the workspace.
- **Pre-commit/Pre-push Hooks**: Husky runs tests as part of pre-commit and pre-push hooks to ensure code quality before changes are pushed.

## Comments

- Comments should be used to explain _why_ a particular piece of code exists or is complex, rather than _what_ it does (which should be clear from the code itself).
- Avoid excessive or redundant comments.
