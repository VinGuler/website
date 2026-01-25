# Monorepo Deployer

A local web application that automates deployment for your monorepo packages. Detects package types, analyzes deployment needs, and provides a simple UI to deploy to popular hosting providers.

## Features

- **Automatic Package Detection**: Scans your monorepo and identifies frontend, backend, and full-stack packages
- **Smart Analysis**: Detects build tools (Vite, webpack, tsc), frameworks (Vue, React, Express), and dependencies
- **Deployment Planning**: Generates vendor recommendations with cost estimates
- **Multiple Vendor Support**: Deploy to Vercel, Railway, Netlify, Render, and more
- **Web UI**: Clean, intuitive interface for managing deployments
- **Environment Management**: Handles environment variables for each deployment
- **Deployment History**: Track all deployments and their status

## Quick Start

### 1. Install Dependencies

```bash
cd deployer/app
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your vendor API tokens (see [Configuration](#configuration) below).

### 3. Start the Deployer

```bash
npm run dev
```

Or from the repository root:

```bash
npm run deployer
```

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

### 1. Scan Your Repository

Click the **"Scan Repository"** button on the Dashboard tab. The deployer will:

- Detect all packages in your `/packages` directory
- Analyze each package's type, framework, and build configuration
- Generate deployment recommendations

### 2. Review Deployment Plans

Switch to the **"Deployment Plan"** tab to see:

- Recommended vendors for each package
- Cost estimates
- Required build commands
- Environment variables needed

### 3. Deploy a Package

Go to the **"Deploy"** tab:

1. Select a package from the dropdown
2. Choose a vendor (recommended options are highlighted)
3. Enter required environment variables
4. Click **"Deploy"**

Watch the deployment progress in real-time with live logs.

### 4. View History

Check the **"History"** tab to see all past deployments and their status.

## Configuration

### Vercel

1. Get your token: [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token with deployment permissions
3. Add to `.env`:
   ```
   VERCEL_TOKEN=your_token_here
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

### Railway

1. Get your token: [https://railway.app/account/tokens](https://railway.app/account/tokens)
2. Add to `.env`:
   ```
   RAILWAY_TOKEN=your_token_here
   ```

### Netlify

1. Get your token: [https://app.netlify.com/user/applications](https://app.netlify.com/user/applications)
2. Create a personal access token
3. Add to `.env`:
   ```
   NETLIFY_AUTH_TOKEN=your_token_here
   NETLIFY_SITE_ID=your_site_id
   ```

### Render

1. Get your API key: [https://dashboard.render.com/account/api-keys](https://dashboard.render.com/account/api-keys)
2. Add to `.env`:
   ```
   RENDER_API_KEY=your_api_key_here
   ```

## Architecture

```
/deployer
  /app
    /src
      /server          # Express backend
        index.ts       # Server entry point
        routes.ts      # API endpoints
      /client          # Frontend
        index.html     # Main UI
        app.ts         # Frontend logic
        styles.css     # Styling
      /services        # Core business logic
        scanner.ts     # Package detection
        analyzer.ts    # Package analysis
        planner.ts     # Deployment planning
        executor.ts    # Deployment execution
        /vendors       # Vendor adapters
          vercel.ts
          railway.ts
          netlify.ts
          render.ts
      /types           # TypeScript types
      /utils           # Utilities
        logger.ts
        validator.ts
```

## API Endpoints

- `GET /api/scan` - Scan packages and return analysis
- `GET /api/packages` - Get detected packages
- `GET /api/deployment-plan` - Get generated deployment plans
- `POST /api/deploy/:packageName` - Execute deployment
- `GET /api/deployment-status/:id` - Check deployment status
- `GET /api/deployments` - Get all deployments

## Package Detection

The deployer automatically detects:

- **Package Type**: Frontend, backend, or full-stack
- **Framework**: Vue, React, Svelte, Express, Fastify, NestJS
- **Build Tool**: Vite, webpack, TypeScript, esbuild, rollup
- **Node Version**: From `engines.node` in package.json
- **Database**: PostgreSQL, MySQL, MongoDB, SQLite, Prisma
- **Environment Variables**: By scanning source code

## Vendor Recommendations

### Frontend Packages (Vite/Vue)

- **Vercel** (Recommended): Zero-config deployment, global CDN, $0-20/month
- **Netlify**: Continuous deployment, forms handling, $0-19/month
- **Cloudflare Pages**: Unlimited bandwidth, Workers support, $0/month

### Backend Packages (Express/Node)

- **Railway** (Recommended): Simple deployment, built-in databases, $5-20/month
- **Render**: Free tier available, managed databases, $0-7/month
- **Fly.io**: Global distribution, Dockerfile support, $0-10/month

## Development

### Build for Production

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Start Production Server

```bash
npm start
```

## Extending the Deployer

### Adding a New Vendor

1. Create a new adapter in `/src/services/vendors/`:

```typescript
import type { VendorAdapter, DeploymentConfig, DeploymentStatus } from '../../types/index.js';

export class MyVendorAdapter implements VendorAdapter {
  name = 'my-vendor' as const;

  getRequiredEnvVars(): string[] {
    return ['MY_VENDOR_TOKEN'];
  }

  async validate(config: DeploymentConfig): Promise<boolean> {
    // Validation logic
    return true;
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentStatus> {
    // Deployment logic
  }
}
```

2. Register in `/src/services/executor.ts`
3. Add to planner recommendations in `/src/services/planner.ts`

## Troubleshooting

### Packages Not Detected

- Ensure packages are in the `/packages` directory
- Check that each package has a valid `package.json`

### Deployment Fails

- Verify environment variables are set correctly
- Check vendor API token has proper permissions
- Review deployment logs for specific errors

### Build Errors

- Ensure TypeScript is installed: `npm install`
- Run type check: `npm run type-check`

## Security Notes

- The `.env` file is gitignored by default
- Never commit API tokens or secrets to version control
- Use environment-specific tokens for production deployments
- Review vendor permissions before deploying

## License

ISC

## Support

For issues or questions about this deployer, check:

- The deployment logs in the UI
- The console output from the dev server
- Vendor-specific documentation for API usage
