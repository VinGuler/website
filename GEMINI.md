# Gemini Project Context: Full-Stack Monorepo

This document provides context for the Gemini AI assistant about the full-stack web application monorepo in this directory.

## Project Overview

This is a TypeScript monorepo for a full-stack web application. It uses `npm` workspaces to manage several packages, including a Vue.js frontend, an Express.js backend, and a full-stack example. The project is set up with modern tooling, including Vite, Vitest, ESLint, and Prettier. It also includes a Docker configuration for containerization and a custom deployment tool.

**Key Technologies:**

- **Frontend:** Vue.js 3, Vite, Pinia (state management), Vue Router
- **Backend:** Express.js, Node.js
- **Language:** TypeScript
- **Testing:** Vitest
- **Linting & Formatting:** ESLint, Prettier
- **Build & Package Management:** npm workspaces
- **Containerization:** Docker, Docker Compose

## Monorepo Structure

The `packages` directory contains the different parts of the application:

- `packages/client-example`: A Vue.js 3 single-page application.
  - **Development:** `npm run dev -w client-example`
  - **Building:** `npm run build -w client-example`
  - **Testing:** `npm run test:client-example`

- `packages/server-example`: An Express.js server.
  - **Development:** `npm run dev -w server-example`
  - **Building:** `npm run build -w server-example`
  - **Testing:** `npm run test:server-example`

- `packages/full-stack-example`: An example of a full-stack application with a simple client and server.
  - **Development:** `npm run dev -w full-stack-example`
  - **Building:** `npm run build -w full-stack-example`
  - **Testing:** `npm run test:full-stack-example`

The `deployer` directory contains a tool for deploying the application to Vercel.

## Building and Running

The root `package.json` provides scripts for managing the entire monorepo.

- `npm install`: Install all dependencies for all packages.
- `npm run dev:client-server-example`: Run the client and server examples concurrently for development.
- `npm run build`: Build all packages for production.
- `npm run test`: Run all tests in the monorepo.
- `npm run lint`: Lint all files.
- `npm run format`: Format all files with Prettier.

### Docker

The application can also be run using Docker:

```sh
docker compose up --build
```

This will build the necessary images and start the application. The app will be available at `http://localhost:3000`.

## Development Conventions

- **Coding Style:** The project uses ESLint and Prettier to enforce a consistent coding style. The configuration can be found in `eslint.config.js` and `.prettierrc`.
- **Testing:** `vitest` is the testing framework. Tests are located in `__tests__` directories within each package. The root `vitest.config.ts` file configures the test runner for the monorepo.
- **Pre-commit Hooks:** Husky is used to run pre-commit hooks, which are configured in `.husky/pre-commit`. These hooks likely run linting and formatting checks.

## Deployment

The `deployer` directory contains a custom tool for deploying the application to Vercel. It has its own `package.json` and can be run with `npm run deployer` from the root directory.
