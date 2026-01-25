# Deployer Implementation Plan

## Overview
Build a local web application that scans this monorepo's packages (client + server), analyzes their deployment needs, and provides a UI to deploy them to appropriate hosting vendors.

## Repository Analysis (Current State)

### Detected Packages:
1. **packages/client**
   - Type: Frontend (SPA)
   - Framework: Vue 3 + Vite
   - Build Tool: Vite
   - Node Version: ^20.19.0 || >=22.12.0
   - Dependencies: vue, vue-router, pinia
   - Deployment Target: Static hosting (Vercel, Netlify, Cloudflare Pages)

2. **packages/server**
   - Type: Backend (API)
   - Framework: Express.js
   - Build Tool: TypeScript
   - Runtime: Node.js
   - Dependencies: express
   - Deployment Target: Node hosting (Railway, Render, Fly.io)

### Repository Configuration:
- Monorepo with npm workspaces
- TypeScript throughout
- ESLint + Prettier configured
- Vitest for testing

## Implementation Plan

### Phase 1: Project Structure Setup
1. Create `/deployer` directory structure:
   ```
   /deployer
     /app
       /src
         /server        # Express backend
         /client        # Frontend (HTML/TS)
         /services      # Core logic
         /types         # TypeScript types
       /public          # Static assets
       package.json
       tsconfig.json
       .env              # Environment variables (gitignored)
       .env.example      # Environment template
     README.md           # Deployer documentation
   ```

2. Initialize deployer app:
   - Set up package.json with dependencies (express, typescript, etc.)
   - Configure TypeScript (extend root tsconfig if possible)
   - Set up build and dev scripts
   - Add .gitignore to exclude .env and node_modules

### Phase 2: Core Services

3. **Scanner Service** (`services/scanner.ts`):
   - Read `/packages` directory
   - For each package, read package.json
   - Detect package type (frontend/backend/fullstack)
   - Extract: name, scripts, dependencies, engines

4. **Analyzer Service** (`services/analyzer.ts`):
   - Classify build tools (Vite, webpack, tsc, etc.)
   - Detect frameworks (Vue, React, Express, etc.)
   - Identify required Node version
   - Infer database needs (check for pg, mysql, mongodb, prisma, etc.)
   - Extract environment variable patterns from code

5. **Deployment Planner Service** (`services/planner.ts`):
   - Generate deployment recommendations per package type:
     - Frontend (Vite) → Vercel, Netlify, Cloudflare Pages
     - Backend (Node/Express) → Railway, Render, Fly.io
   - Estimate costs (rough monthly ranges)
   - Generate deployment configuration templates

6. **Vendor Adapters** (`services/vendors/`):
   - Create adapters for each vendor (Vercel, Railway, etc.)
   - Implement deployment logic using vendor CLIs/APIs
   - Handle authentication and configuration

### Phase 3: Backend API

7. **Server Setup** (`server/index.ts`):
   - Express server with TypeScript
   - Serve static frontend
   - REST API endpoints

8. **API Endpoints**:
   - `GET /api/scan` - Scan packages and return analysis
   - `GET /api/packages` - Get detected packages
   - `GET /api/deployment-plan` - Get generated deployment plan
   - `POST /api/deploy/:packageName` - Execute deployment
   - `GET /api/deployment-status/:id` - Check deployment progress
   - `POST /api/config` - Update deployment configuration
   - `GET /api/env/:packageName` - Get required env vars

### Phase 4: Frontend UI

9. **Pages/Views**:
   - Dashboard: Overview of detected packages
   - Package Details: Show analysis for each package
   - Deployment Plan: Review and edit proposed deployment
   - Configuration: Set env vars, choose vendors
   - Deploy: Execute deployment with real-time progress
   - Status: View deployment history and logs

10. **UI Implementation**:
    - Use vanilla TypeScript + HTML (or minimal framework like Lit)
    - Simple CSS for styling (or use a lightweight CSS framework)
    - Fetch API for backend communication
    - Real-time updates using SSE or polling

### Phase 5: Configuration & Environment

11. **Environment Variables** (`/deployer/app/.env`):
    - Vendor API keys (VERCEL_TOKEN, RAILWAY_TOKEN, etc.)
    - Default deployment settings
    - Repository metadata
    - Create `.env.example` as a template

12. **Configuration Files**:
    - Deployment templates for each vendor (JSON configs)
    - Default cost estimates (hardcoded in planner)
    - Vendor capabilities matrix (TypeScript constants)
    - .gitignore to protect secrets

### Phase 6: Documentation

13. **README.md**:
    - How to set up the deployer
    - How to configure vendor credentials
    - How to use the web UI
    - Architecture overview
    - Troubleshooting guide

## Technical Decisions

### Tech Stack:
- **Backend**: Express + TypeScript
- **Frontend**: HTML + TypeScript (minimal, no heavy framework)
- **Build**: TSC for TypeScript compilation
- **Dev Server**: tsx for hot reload during development

### Vendor Strategy:
- **Frontend (Client)**:
  - Primary: Vercel (best for Vite/Vue)
  - Alternative: Netlify, Cloudflare Pages

- **Backend (Server)**:
  - Primary: Railway (simple, good DX)
  - Alternative: Render, Fly.io

### Safety Features:
- Dry-run mode before actual deployment
- Explicit user confirmation required
- Deployment logs saved locally
- Rollback information provided
- Environment validation before deployment

## File Structure

```
/deployer
  /app
    /src
      /server
        index.ts           # Express server entry
        routes.ts          # API routes
      /client
        index.html         # Main UI
        app.ts            # Frontend logic
        styles.css        # Styling
      /services
        scanner.ts         # Package scanner
        analyzer.ts        # Package analyzer
        planner.ts        # Deployment planner
        executor.ts       # Deployment executor
        /vendors
          vercel.ts        # Vercel adapter
          railway.ts       # Railway adapter
          netlify.ts       # Netlify adapter
          render.ts        # Render adapter
      /types
        index.ts          # TypeScript types
      /utils
        logger.ts         # Logging utility
        validator.ts     # Config validation
    /public
      # Static assets
    package.json
    tsconfig.json
    .env                  # Environment variables (gitignored)
    .env.example          # Environment template
    .gitignore            # Ignore .env, node_modules, dist
  README.md               # Deployer documentation
```

## Implementation Order

1. Set up project structure and configuration
2. Build scanner service (detect packages)
3. Build analyzer service (classify packages)
4. Build planner service (generate deployment plans)
5. Create Express backend with API endpoints
6. Build frontend UI (dashboard → details → deploy)
7. Implement vendor adapters (start with Vercel + Railway)
8. Add configuration and environment management
9. Write documentation
10. Test end-to-end deployment flow

## Success Criteria

- [ ] Deployer correctly identifies client (Vue/Vite) and server (Express)
- [ ] Generates accurate deployment recommendations
- [ ] Web UI displays all package information clearly
- [ ] Can configure environment variables through UI
- [ ] Can deploy to at least one vendor (Vercel for client, Railway for server)
- [ ] Shows deployment progress and logs
- [ ] Safe and reversible (provides rollback info)
- [ ] Well-documented and easy to use

## Cost Estimates (Rough)

- **Client (Vercel)**: Free tier available, Pro ~$20/mo
- **Server (Railway)**: ~$5-10/mo for small apps
- **Total**: ~$0-30/mo depending on usage

---

**Next Steps**: Begin implementation starting with Phase 1 (Project Structure Setup)
