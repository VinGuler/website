# Railway Deployment Guide - Monorepo Multi-App Setup

This guide explains how to deploy apps from this pnpm monorepo to Railway. Each app in `apps/` can be deployed as a separate Railway service.

## Monorepo Architecture

This workspace supports deploying **multiple apps** independently:

```
workspace/
├── apps/
│   ├── finance-tracker/        ← Deployable app (has railway.json)
│   └── your-next-app/          ← Future apps go here
├── packages/                   ← Shared code (@workspace/*)
└── railway.template.json       ← Template for new apps
```

**Key points:**

- Each app has its own `railway.json` configuration
- All apps share workspace dependencies (`@workspace/*`)
- Railway detects changes via `watchPatterns` (app + packages)
- One Railway **Project** can have multiple **Services** (one per app)

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway
- Railway CLI (optional): `npm i -g @railway/cli`

## Quick Deploy - Single App (finance-tracker)

### Option 1: Deploy from GitHub (Recommended)

1. **Create a New Project in Railway**

   ```bash
   # Visit: https://railway.app/new
   # Click "Deploy from GitHub repo"
   # Select this repository
   ```

2. **Add PostgreSQL Database**

   ```bash
   # In your Railway project:
   # Click "New" → "Database" → "Add PostgreSQL"
   # Railway will automatically set DATABASE_URL environment variable
   ```

3. **Configure Environment Variables**

   Go to your service settings → Variables tab and add:

   | Variable       | Value                        | Notes                                        |
   | -------------- | ---------------------------- | -------------------------------------------- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-set when you add PostgreSQL             |
   | `JWT_SECRET`   | `<generate-secure-string>`   | **REQUIRED** - Use `openssl rand -base64 32` |
   | `NODE_ENV`     | `production`                 | Optional                                     |

4. **Configure Service Settings**
   - **Root Directory**: `apps/finance-tracker`
   - **Build Command**: Handled by `railway.json` in app directory
   - **Start Command**: Handled by `railway.json` in app directory
   - **Watch Paths**: Handled by `railway.json` (app + packages)

5. **Deploy**
   ```bash
   # Railway will automatically deploy on push to main
   # Or manually trigger: Railway dashboard → Deploy → "Deploy now"
   ```

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to your project
railway link

# Add PostgreSQL
railway add --database postgresql

# Set environment variables
railway variables set JWT_SECRET=<your-secure-secret>

# Deploy
railway up
```

## Deploying Multiple Apps

To add a new app to Railway:

1. **Copy the template**:

   ```bash
   cp railway.template.json apps/your-new-app/railway.json
   ```

2. **Update APP_NAME placeholders**:

   ```json
   // In apps/your-new-app/railway.json
   "buildCommand": "cd ../.. && pnpm install --frozen-lockfile && cd apps/your-new-app && pnpm run build",
   "watchPatterns": ["apps/your-new-app/**", "packages/**"]
   ```

3. **Create a new Railway Service**:
   - Go to your Railway Project
   - Click "New" → "GitHub Repo" (same repo)
   - Set **Root Directory**: `apps/your-new-app`
   - Railway will auto-detect `railway.json`

4. **Configure environment variables** (per service)

5. **Deploy** - Each service deploys independently

**Result**: Multiple apps in one Railway Project, sharing the monorepo but deployed separately.

## Configuration Files

### `apps/<app-name>/railway.json`

Per-app configuration file:

- Specifies build/deploy commands from app directory
- Configures healthcheck endpoint
- Sets watch patterns (triggers rebuild on changes to app or packages)

### `railway.template.json`

Template for creating new apps. Copy to each new app directory.

### `railway.env.example`

Template for required environment variables (at root for reference).

## Database Migrations

Railway will automatically run `prisma generate` during build (configured in `railway.json`).

For migrations, you have two options:

### Option 1: Auto-migrate on Build (Recommended for Development)

Modify `railway.json` build command in your app directory to include:

```json
"buildCommand": "cd ../.. && pnpm install --frozen-lockfile && cd apps/your-app && pnpm run db:push && pnpm run build"
```

### Option 2: Manual Migrations (Recommended for Production)

```bash
# Using Railway CLI
railway run pnpm --filter=finance-tracker run db:migrate

# Or connect to Railway shell
railway shell
cd apps/finance-tracker
pnpm run db:migrate
```

## Post-Deployment

1. **Check Deployment Logs**

   ```bash
   railway logs
   ```

2. **Test Health Endpoint**

   ```bash
   curl https://your-app.railway.app/api/health
   ```

3. **Seed Database (Optional)**

   ```bash
   railway run pnpm --filter=finance-tracker run db:seed
   ```

4. **Access Your App**
   ```
   https://your-app.railway.app
   ```

## Build Process

Railway builds from the monorepo root:

1. Installs all pnpm workspace dependencies (including `@workspace/*` packages)
2. Changes to app directory (`cd apps/<app-name>`)
3. Generates Prisma client (`pnpm run db:generate`)
4. Builds server + client (`pnpm run build`)
5. Starts with `node dist/server/index.js`

**Watch Patterns**: Rebuilds trigger on changes to:

- `apps/<app-name>/**` (your app code)
- `packages/**` (shared workspace dependencies)

## Troubleshooting

### Build Fails

- Check that `pnpm-lock.yaml` is committed
- Verify all workspace dependencies are available
- Check Railway build logs for specific errors

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running in Railway
- Ensure database migrations have run

### App Crashes on Start

- Check `JWT_SECRET` environment variable is set
- Verify PORT is not hardcoded (Railway sets it automatically)
- Review Railway deployment logs

### Prisma Client Issues

- Ensure `prisma generate` runs during build
- Check that `@prisma/client` version matches `prisma` dev dependency
- Verify schema.prisma is in `apps/finance-tracker/prisma/`

## Environment Variables Reference

| Variable       | Required | Default       | Description                                        |
| -------------- | -------- | ------------- | -------------------------------------------------- |
| `DATABASE_URL` | ✅ Yes   | -             | PostgreSQL connection string (auto-set by Railway) |
| `JWT_SECRET`   | ✅ Yes   | -             | Secret key for JWT token signing                   |
| `PORT`         | ⚠️ Auto  | `3010`        | Server port (Railway sets automatically)           |
| `NODE_ENV`     | ❌ No    | `development` | Node environment mode                              |

## Custom Domain

To add a custom domain:

1. Go to Railway project → Settings → Domains
2. Click "Add Domain"
3. Follow DNS configuration instructions

## Scaling

Railway automatically scales based on usage. For manual scaling:

- Go to project Settings → Resources
- Adjust memory/CPU limits as needed

## Costs

Railway pricing: https://railway.app/pricing

- Free tier: $5 credit/month
- Typical finance-tracker usage: ~$5-10/month (Hobby plan)

## Quick Reference: Multi-App Workflow

```bash
# 1. Create a new app in the monorepo
cd apps
cp -r ../templates/client-server-database my-new-app

# 2. Set up Railway config
cp ../railway.template.json my-new-app/railway.json

# 3. Update railway.json (replace APP_NAME with my-new-app)
# Edit: apps/my-new-app/railway.json

# 4. Commit and push
git add apps/my-new-app
git commit -m "feat: add my-new-app"
git push

# 5. Deploy to Railway
# Option A: Via Dashboard
#   - Go to Railway Project → New → GitHub Repo (same repo)
#   - Set Root Directory: apps/my-new-app
#   - Add environment variables
#   - Deploy

# Option B: Via CLI
railway init
railway service add --name my-new-app --root apps/my-new-app
railway variables set JWT_SECRET=<secret>
railway up
```

**Result**: Each app deploys independently with its own:

- Service URL (e.g., `my-new-app.railway.app`)
- Environment variables
- Database (if needed)
- Build/deploy pipeline

**Shared across all apps**:

- Monorepo codebase
- `@workspace/*` packages
- Railway Project (contains all services)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: [Your repo issues page]
