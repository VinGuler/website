# Deployer Design Document

## System Overview

The Deployer is a production deployment management tool for monorepo packages. It provides package analysis, vendor selection, deployment execution, and statistics tracking through a local web interface.

---

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                     Web Browser                          │
│                   (User Interface)                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────┐
│                 Express Server                           │
│                  (API Routes)                            │
└─────┬──────────┬─────────┬──────────┬───────────────────┘
      │          │         │          │
      ▼          ▼         ▼          ▼
┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
│ Scanner │ │Analyzer │ │Planner │ │ Executor │
└─────────┘ └─────────┘ └────────┘ └────┬─────┘
                                         │
                           ┌─────────────▼──────────────┐
                           │   Vendor Adapters          │
                           │  (Vercel, Railway, etc.)   │
                           └────────────────────────────┘
      ┌─────────────────────────────┐
      │      Data Service           │
      │   (JSON Persistence)        │
      └──────┬──────────────────────┘
             │
      ┌──────▼──────┐  ┌──────────────┐
      │packages.json│  │deployments.json│
      └─────────────┘  └──────────────┘
```

### Component Responsibilities

1. **Scanner** - Discovers packages in `/packages` directory
2. **Analyzer** - Classifies packages (type, framework, dependencies)
3. **Planner** - Generates deployment recommendations with vendor options
4. **Executor** - Orchestrates deployments via vendor adapters
5. **Vendor Adapters** - Interface with specific hosting platforms
6. **Data Service** - Persists packages and deployment records

---

## Data Models

### Package Information

```typescript
interface PackageInfo {
  name: string; // Package name
  path: string; // Relative path in monorepo
  type: PackageType; // frontend | backend | fullstack
  framework: Framework; // vue | react | express | etc.
  buildTool: BuildTool; // vite | webpack | tsc | etc.
  nodeVersion?: string; // Required Node version
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  hasDatabase: boolean; // Database dependency detected
  databaseType?: string; // postgres | mysql | mongodb | etc.
  requiredEnvVars: string[]; // Detected env var requirements
}
```

### Saved Package (Persisted)

```typescript
interface SavedPackage extends PackageInfo {
  id: string; // Unique identifier
  scannedAt: string; // ISO timestamp of last scan
  lastDeployedAt?: string; // ISO timestamp of last deployment
  deploymentCount: number; // Total deployments for this package
}
```

### Deployment Options

```typescript
interface DeploymentOption {
  vendor: VendorName; // vercel | railway | etc.
  vendorDisplayName: string; // Human-readable name
  recommended: boolean; // Is this the recommended option?
  estimatedCost: {
    min: number; // Minimum monthly cost
    max: number; // Maximum monthly cost
    currency: string; // USD
    period: string; // month
  };
  features: string[]; // List of key features
  limitations?: string[]; // Known limitations
}
```

### Deployment Plan

```typescript
interface DeploymentPlan {
  packageName: string;
  packageType: PackageType;
  deploymentOptions: DeploymentOption[]; // Multiple vendor choices
  buildCommand?: string; // Recommended build command
  outputDirectory?: string; // Build output directory
  envVarsRequired: string[]; // Required env vars
  notes: string[]; // Important notes for user
}
```

### Deployment Configuration (User-Selected)

```typescript
interface DeploymentConfig {
  packageName: string;
  vendor: VendorName; // User-selected vendor
  envVars: Record<string, string>; // User-provided env vars
  buildCommand?: string; // Custom build command
  outputDirectory?: string; // Custom output directory
  customConfig?: Record<string, any>; // Vendor-specific config
}
```

### Deployment Record (Persisted)

```typescript
interface DeploymentRecord {
  id: string; // Unique deployment ID
  packageId: string; // Foreign key to SavedPackage
  packageName: string; // Denormalized for querying
  vendor: VendorName; // Vendor used
  status: DeploymentStatus; // pending | building | deploying | success | failed
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp (if completed)
  logs: string[]; // Deployment logs
  error?: string; // Error message (if failed)
  deploymentUrl?: string; // Live deployment URL
  envVars?: string[]; // Env var keys only (no values)
}
```

---

## API Endpoints

### Package Management

#### `GET /api/scan`

Scans the monorepo, analyzes packages, and saves to disk.

**Response:**

```json
{
  "success": true,
  "data": {
    "packages": SavedPackage[],
    "scannedAt": "2024-01-15T10:30:00Z",
    "repositoryRoot": "/path/to/repo"
  }
}
```

#### `GET /api/packages`

Retrieves all saved packages with deployment stats.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      ...SavedPackage,
      "latestDeployment": {
        "vendor": "vercel",
        "status": "success",
        "deployedAt": "2024-01-15T10:30:00Z",
        "deploymentUrl": "https://app.vercel.app"
      }
    }
  ]
}
```

### Deployment Planning

#### `GET /api/deployment-plan`

Generates deployment plans for all packages.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "packageName": "client",
      "packageType": "frontend",
      "deploymentOptions": [
        {
          "vendor": "vercel",
          "vendorDisplayName": "Vercel",
          "recommended": true,
          "estimatedCost": { "min": 0, "max": 20, "currency": "USD", "period": "month" },
          "features": ["Edge Functions", "Auto-scaling", "Global CDN"],
          "limitations": []
        }
      ],
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "envVarsRequired": ["VITE_API_URL"],
      "notes": ["Optimized for Vite projects"]
    }
  ]
}
```

### Deployment Execution

#### `POST /api/deploy/:packageName`

Executes a deployment for the specified package.

**Request Body:**

```json
{
  "packageName": "client",
  "vendor": "vercel",
  "envVars": {
    "VITE_API_URL": "https://api.example.com"
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1234567890-abc123",
    "packageName": "client",
    "vendor": "vercel",
    "status": "pending",
    "startedAt": "2024-01-15T10:30:00Z",
    "logs": ["Starting deployment..."]
  }
}
```

#### `GET /api/deployment-status/:id`

Checks the status of a specific deployment.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "1234567890-abc123",
    "status": "success",
    "completedAt": "2024-01-15T10:35:00Z",
    "deploymentUrl": "https://app.vercel.app",
    "logs": [...]
  }
}
```

### Deployment History

#### `GET /api/deployments`

Retrieves all deployment records, sorted by most recent first.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890-abc123",
      "packageName": "client",
      "vendor": "vercel",
      "status": "success",
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:35:00Z",
      "deploymentUrl": "https://app.vercel.app"
    }
  ]
}
```

---

## Service Layer Design

### Scanner Service

**Purpose:** Discover packages in the monorepo

**Methods:**

- `scan(): Promise<ScanResult>` - Scans `/packages` directory and returns basic package info

**Logic:**

1. Read `/packages` directory
2. For each subdirectory, check if `package.json` exists
3. Parse `package.json` and extract metadata
4. Return array of packages with basic info

### Analyzer Service

**Purpose:** Classify packages and extract detailed metadata

**Methods:**

- `analyze(packageInfo: PackageInfo): Promise<PackageInfo>` - Enhances package info with classification

**Logic:**

1. Detect package type (frontend/backend/fullstack) by analyzing dependencies
2. Identify framework (Vue, React, Express, etc.)
3. Detect build tool (Vite, webpack, TypeScript, etc.)
4. Parse scripts to find build commands
5. Detect database dependencies
6. Extract required environment variables (heuristic-based)
7. Return enriched package info

**Classification Rules:**

- **Frontend:** Has `vite`, `react`, `vue`, `svelte`, etc. in dependencies
- **Backend:** Has `express`, `fastify`, `nest`, etc. in dependencies
- **Fullstack:** Has both frontend and backend indicators
- **Database:** Detects `pg`, `mysql2`, `mongodb`, `prisma`, `drizzle`, etc.

### Planner Service

**Purpose:** Generate deployment recommendations

**Methods:**

- `generatePlan(packageInfo: PackageInfo): DeploymentPlan` - Creates deployment plan with vendor options

**Logic:**

1. Based on package type, suggest appropriate vendors
2. For each vendor, provide:
   - Cost estimates (hardcoded ranges)
   - Feature list
   - Limitations (if any)
3. Mark recommended vendor (opinionated defaults)
4. Extract build command and output directory from package.json scripts
5. List required environment variables
6. Add helpful notes

**Vendor Recommendations:**

- **Frontend:** Vercel (recommended), Netlify, Cloudflare Pages
- **Backend:** Railway (recommended), Render, Fly.io

### Executor Service

**Purpose:** Orchestrate deployments

**Methods:**

- `deploy(config: DeploymentConfig): Promise<DeploymentStatus>` - Executes deployment
- `getDeploymentStatus(id: string): DeploymentStatus | null` - Retrieves deployment status

**Logic:**

1. Validate deployment configuration
2. Select appropriate vendor adapter
3. Execute deployment via adapter
4. Track deployment status (in-memory)
5. Save deployment record to disk
6. Update package deployment stats
7. Return deployment status

### Data Service

**Purpose:** Persist and retrieve data

**Methods:**

- `getAllPackages(): Promise<SavedPackage[]>`
- `savePackage(pkg: PackageInfo): Promise<SavedPackage>`
- `getPackageById(id: string): Promise<SavedPackage | null>`
- `updatePackageDeployment(packageId: string): Promise<void>`
- `getAllDeployments(): Promise<DeploymentRecord[]>`
- `saveDeployment(deployment): Promise<DeploymentRecord>`
- `updateDeploymentStatus(id: string, updates): Promise<void>`
- `getDeploymentsByPackage(packageId: string): Promise<DeploymentRecord[]>`
- `getLatestDeployment(packageId: string): Promise<DeploymentRecord | null>`

**Storage:**

- Uses JSON files: `packages.json` and `deployments.json`
- Files stored in `/deployer/app/data/`
- Simple read/write operations with JSON.parse/stringify

### Vendor Adapters

**Purpose:** Interface with specific hosting platforms

**Interface:**

```typescript
interface VendorAdapter {
  name: VendorName;
  deploy(config: DeploymentConfig): Promise<DeploymentStatus>;
  validate(config: DeploymentConfig): Promise<boolean>;
  getRequiredEnvVars(): string[];
}
```

**Implementations:**

- **Vercel** - Uses Vercel CLI or API
- **Railway** - Uses Railway CLI or API
- **Netlify** - Uses Netlify CLI or API
- **Render** - Uses Render API
- **Cloudflare Pages** - Uses Wrangler CLI
- **Fly.io** - Uses Fly CLI

**Deployment Flow:**

1. Validate configuration (API keys, env vars)
2. Build package locally or trigger remote build
3. Upload/deploy to vendor platform
4. Stream logs back to deployment status
5. Return deployment URL on success

---

## User Workflows

### Initial Setup

1. User runs `npm install` in `/deployer/app`
2. User copies `.env.example` to `.env`
3. User adds vendor API keys to `.env`
4. User runs `npm run dev` to start the deployer
5. Browser opens to `http://localhost:3000`

### First-Time Deployment

1. User clicks "Scan Packages" button
2. System scans monorepo and displays detected packages
3. User selects a package to deploy
4. System shows deployment plan with vendor options
5. User selects preferred vendor
6. User enters required environment variables
7. User clicks "Deploy" button
8. System executes deployment and shows real-time progress
9. On success, displays deployment URL
10. Package stats updated (deployment count, last deployed)

### Subsequent Deployments

1. User navigates to packages list
2. Sees package with existing deployment stats
3. Clicks "Deploy Again" or "Redeploy"
4. Previous configuration pre-filled
5. User can modify settings or keep as-is
6. Clicks "Deploy"
7. New deployment record created
8. Stats updated

### Viewing Deployment History

1. User navigates to "Deployments" page
2. Sees table of all deployments (all packages)
3. Can filter by package, vendor, or status
4. Clicks deployment to view full logs
5. Can see deployment URL, duration, status

---

## Security Considerations

### Environment Variables

- Stored in `.env` file (gitignored)
- Never sent to client (except keys for display)
- Values not persisted in deployment records
- Only environment variable **keys** stored in records

### API Keys

- Vendor API keys stored in `.env`
- Required for deployments
- Validated before deployment
- Never exposed in UI or API responses

### Local-Only Operation

- No external data storage
- No telemetry or analytics sent
- All data stays on developer's machine
- Vendor adapters only communicate with chosen platforms

---

## Performance Considerations

### Scanning

- Fast directory traversal (only `/packages` scanned)
- Minimal file I/O (only `package.json` files read)
- No heavy parsing or analysis

### Deployment

- Asynchronous execution
- Non-blocking API (returns status immediately)
- Status polling for progress updates
- Logs streamed incrementally

### Data Persistence

- Lightweight JSON files
- Read on-demand (not kept in memory)
- Write atomically (prevents corruption)
- No database overhead

---

## Error Handling

### Scanner Errors

- Missing packages directory → Return empty result
- Invalid package.json → Skip package, log warning
- Permission errors → Show helpful error message

### Deployment Errors

- Missing API keys → Show configuration error
- Invalid vendor → Reject with 400 error
- Deployment failure → Save error in record, show to user
- Network errors → Retry logic in vendor adapters

### Data Persistence Errors

- File write failures → Show error, don't lose in-memory state
- JSON parse errors → Show warning, fall back to empty state
- Disk full → Clear error message with troubleshooting steps

---

## Future Enhancements

### Phase 2: Frontend UI

- Implement web interface with all planned views
- Real-time deployment streaming (SSE/WebSockets)
- Interactive vendor comparison
- Cost calculator

### Phase 3: Advanced Features

- Multi-package deployments
- Deployment rollback
- Environment variable templates
- Deployment scheduling
- Webhook triggers

### Phase 4: Data & Analytics

- Migration to SQLite/PostgreSQL
- Advanced deployment analytics
- Cost tracking with actual usage
- Performance monitoring integration

### Phase 5: Platform Expansion

- Additional vendor adapters (AWS, Azure, Heroku)
- Docker/Kubernetes support
- Self-hosted deployment options
- Custom deployment scripts
