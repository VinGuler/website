# Railway Advanced Deployment Guide - Monorepo

🚀 Overview
This document outlines specialized configurations for deploying monorepo applications (e.g., Turborepo/pnpm) on Railway. It provides context for both human developers and AI agents regarding advanced networking, build processes, and database synchronization strategies.

🛠 Build Configuration: `<APP_NAME>.railway.toml` (Optional, for advanced cases)
For advanced monorepo setups, a custom Railway configuration file might be placed at the project root or within the app directory. This file can override default Railpack/Nixpacks behavior to handle monorepo complexities.

Key Logic:

- **Builder Selection**: `RAILPACK` is recommended for modern, fast builds, especially for monorepos.
- **Root Directory**: Often set to `/` at the monorepo root so that pnpm can access workspace-wide `node_modules` and shared packages (like `@workspace/database`).
- **Internal Network Gap**: Railway isolates the build container from the private network. Therefore, database operations (like `prisma db push`) that rely on internal database URLs (`.internal`) cannot happen in the build phase. These operations must occur in the `preDeployCommand`.

Example `railway.toml` (if used at root for advanced monorepo control):

```toml
[build]
builder = "RAILPACK"
rootDirectory = "/"

[deploy]
# ⚠️ CRITICAL: The preDeployCommand runs AFTER the build but BEFORE the app starts.
# It is the only phase that has access to 'postgres.railway.internal'.
preDeployCommand = "pnpm --filter <APP_NAME> exec prisma db push"
startCommand = "pnpm start:app:<APP_NAME>" # Adjust based on your monorepo's start script
```

🏗 Monorepo & Package Manager Fixes

1.  **Strict Hoisting (`.npmrc`)**
    By default, pnpm hides dependencies. This can cause TypeScript errors in shared packages (e.g., `@workspace/database` cannot find `@prisma/client`).
    **Fix**: A `.npmrc` file at the root with `public-hoist-pattern[]=_prisma_` ensures Prisma types are globally accessible across the monorepo.

2.  **Node.js Versioning**
    Ensure your Node.js version meets your application's requirements (e.g., Prisma 6+ requires Node 20.19+ or 22.12+).
    **Fix**: Set `NIXPACKS_NODE_VERSION=22` and `RAILPACK_NODE_VERSION=22` in Railway variables to ensure the environment meets these strict requirements.

🗄 Database Connectivity

- **Private vs. Public Networking**
  - **Internal URL**: `postgresql://postgres:password@postgres.railway.internal:5432/railway`
  - **Usage**: Assigned to the `DATABASE_URL` variable in Railway.
  - **Why**: This is faster, more secure, and avoids Railway egress costs.
  - **Challenge**: Because `.internal` addresses do not resolve during the build step, all Prisma schema synchronization (e.g., `prisma db push`) must happen in the `preDeployCommand`.

- **Tables Generation**
  We recommend `prisma db push` instead of `migrate dev`.
  **Reason**: `migrate dev` is interactive and meant for local use. `db push` is idempotent and ideal for automated deployments to synchronize the `schema.prisma` with the live database.

🌐 Networking & Cloudflare

- **Application Port**: Your application should be configured to listen on a dynamic port provided by the environment, or a default (e.g., `8080`) if the environment variable is not present. Railway typically exposes `PORT`.
- **Cloudflare Setup**:
  - **DNS**: Create a CNAME record pointing to the Railway-generated domain (`xxx.up.railway.app`).
  - **Proxy**: Orange Cloud (Proxied) ON.
  - **SSL**: Must be set to `Full (strict)`. (Flexible or Full will cause redirect loops).
  - **Railway Side**: If using a custom domain, the Target Port in Railway Settings must be explicitly set to your application's listening port (e.g., `8080`).

🤖 Troubleshooting for AI Agents

- **If the build fails with `TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'`**:
  - Check if `pnpm install` ran successfully at the root.
  - Verify the `.npmrc` hoisting pattern (`public-hoist-pattern[]=_prisma_`) is present.
  - Ensure the `preDeployCommand` (if used) hasn't been moved back into the build phase.
- **If the app fails to start or connect to the database**:
  - Verify `DATABASE_URL` is correctly set in Railway environment variables.
  - Confirm the PostgreSQL service is running in Railway.
  - Check deployment logs for `preDeployCommand` execution status.
  - Ensure `startCommand` in `railway.toml` (or Nixpacks config) is correct.
