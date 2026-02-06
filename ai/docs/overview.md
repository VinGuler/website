# Workspace Overview

This document provides a high-level overview of the `workspace` monorepo, its architectural principles, and key technologies.

## Purpose

The `workspace` monorepo serves as a factory for building various applications, from simple landing pages to full-stack applications with databases. It aims to provide a consistent development experience, leverage shared tooling and code, and facilitate the quick scaffolding and deployment of new projects. It's designed to be independently maintainable by AI agents.

## Monorepo Structure

The workspace is structured using `pnpm` for package management and `Turborepo` for build orchestration and caching.

- **`pnpm`**: Manages the workspace, ensuring efficient dependency management and disk space usage through content-addressable storage. It enforces strict dependency boundaries.
- **`Turborepo`**: Provides caching and task orchestration, managing the build pipeline (`build`, `dev`, `test`, `lint`) and ensuring correct task ordering (e.g., `prisma generate` before app builds).
- **`/packages`**: Contains internal shared libraries and reusable components (e.g., `@workspace/utils`).
- **`/apps`**: Hosts deployable application projects, scaffolded from templates, that consume internal packages.
- **`/templates`**: Stores "Gold Master" templates for rapid project scaffolding, ensuring consistency and zero manual configuration.

## Key Technologies

- **Frontend**: Vue 3 (Composition API) + Vite (for client-only and client-server apps).
- **Backend**: Node.js + Express (for API servers and client-server apps).
- **Database/ORM**: Prisma + PostgreSQL. Prisma client is shared via `@workspace/database`, with per-app Prisma schemas.
- **Language**: TypeScript for end-to-end type safety across the entire stack.
- **Tooling**: ESLint, Prettier, Vitest, Husky.

## Templates Available

- **`landing-page`**: Client-only Vue 3 + Vite SPA.
- **`api-server`**: Node.js Express API server with minimal UI.
- **`client-server`**: Vue 3 SPA with a Node.js Express backend.
- **`client-server-database`**: Full-stack application including client, server, Prisma, and PostgreSQL.

## Deployment

The workspace is designed for deployment on Railway, which provides monorepo integration, automatic deployments on push, subdomain routing, and managed infrastructure (Postgres, environment variables, SSL).

## Portability

The workspace supports "flattening" an application into a standalone repository using a specialized skill (Exporter). This process bundles internal `@workspace` dependencies, generates a clean `package.json`, fresh Git history, and a `docker-compose.yml` for local Postgres provisioning, making the exported repo "clone-and-run" ready.
