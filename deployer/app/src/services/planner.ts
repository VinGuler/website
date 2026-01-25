import type {
  PackageInfo,
  DeploymentPlan,
  DeploymentOption,
  VendorName,
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class Planner {
  generatePlan(packageInfo: PackageInfo): DeploymentPlan {
    logger.debug(`Generating deployment plan for: ${packageInfo.name}`);

    const deploymentOptions = this.getDeploymentOptions(packageInfo);
    const buildCommand = this.getBuildCommand(packageInfo);
    const outputDirectory = this.getOutputDirectory(packageInfo);
    const notes = this.generateNotes(packageInfo);

    return {
      packageName: packageInfo.name,
      packageType: packageInfo.type,
      deploymentOptions,
      buildCommand,
      outputDirectory,
      envVarsRequired: packageInfo.requiredEnvVars,
      notes,
    };
  }

  private getDeploymentOptions(packageInfo: PackageInfo): DeploymentOption[] {
    switch (packageInfo.type) {
      case 'frontend':
        return this.getFrontendOptions(packageInfo);
      case 'backend':
        return this.getBackendOptions(packageInfo);
      case 'fullstack':
        return [...this.getFrontendOptions(packageInfo), ...this.getBackendOptions(packageInfo)];
      default:
        return [];
    }
  }

  private getFrontendOptions(packageInfo: PackageInfo): DeploymentOption[] {
    const options: DeploymentOption[] = [];

    // Vercel - best for Vite/Vue
    if (packageInfo.buildTool === 'vite' || packageInfo.framework === 'vue') {
      options.push({
        vendor: 'vercel',
        vendorDisplayName: 'Vercel',
        recommended: true,
        estimatedCost: {
          min: 0,
          max: 20,
          currency: 'USD',
          period: 'month',
        },
        features: [
          'Automatic deployments from Git',
          'Global CDN',
          'Serverless functions support',
          'Preview deployments',
          'Zero config for Vite',
        ],
        limitations: ['Free tier: 100GB bandwidth/month'],
      });
    }

    // Netlify
    options.push({
      vendor: 'netlify',
      vendorDisplayName: 'Netlify',
      recommended: false,
      estimatedCost: {
        min: 0,
        max: 19,
        currency: 'USD',
        period: 'month',
      },
      features: [
        'Continuous deployment',
        'Global CDN',
        'Forms handling',
        'Split testing',
      ],
      limitations: ['Free tier: 100GB bandwidth/month'],
    });

    // Cloudflare Pages
    options.push({
      vendor: 'cloudflare-pages',
      vendorDisplayName: 'Cloudflare Pages',
      recommended: false,
      estimatedCost: {
        min: 0,
        max: 0,
        currency: 'USD',
        period: 'month',
      },
      features: [
        'Unlimited bandwidth',
        'Global CDN',
        'Cloudflare Workers integration',
      ],
      limitations: ['500 builds/month on free tier'],
    });

    return options;
  }

  private getBackendOptions(packageInfo: PackageInfo): DeploymentOption[] {
    const options: DeploymentOption[] = [];

    // Railway - recommended for Node.js
    options.push({
      vendor: 'railway',
      vendorDisplayName: 'Railway',
      recommended: true,
      estimatedCost: {
        min: 5,
        max: 20,
        currency: 'USD',
        period: 'month',
      },
      features: [
        'Easy deployment from Git',
        'Built-in database support',
        'Environment variables management',
        'Automatic SSL',
        'Simple pricing',
      ],
      limitations: ['$5 free credit/month'],
    });

    // Render
    options.push({
      vendor: 'render',
      vendorDisplayName: 'Render',
      recommended: false,
      estimatedCost: {
        min: 0,
        max: 7,
        currency: 'USD',
        period: 'month',
      },
      features: [
        'Free tier available',
        'Auto-deploy from Git',
        'Managed databases',
        'Zero-downtime deploys',
      ],
      limitations: ['Free tier spins down after inactivity'],
    });

    // Fly.io
    options.push({
      vendor: 'fly',
      vendorDisplayName: 'Fly.io',
      recommended: false,
      estimatedCost: {
        min: 0,
        max: 10,
        currency: 'USD',
        period: 'month',
      },
      features: [
        'Global distribution',
        'Free allowances',
        'Great for real-time apps',
        'Dockerfile support',
      ],
      limitations: ['Requires Docker configuration'],
    });

    return options;
  }

  private getBuildCommand(packageInfo: PackageInfo): string | undefined {
    const scripts = packageInfo.scripts;

    if (scripts.build) {
      return 'npm run build';
    }

    if (packageInfo.type === 'frontend' && packageInfo.buildTool === 'vite') {
      return 'vite build';
    }

    if (packageInfo.type === 'backend' && packageInfo.buildTool === 'tsc') {
      return 'tsc';
    }

    return undefined;
  }

  private getOutputDirectory(packageInfo: PackageInfo): string | undefined {
    if (packageInfo.type === 'frontend') {
      if (packageInfo.buildTool === 'vite') {
        return 'dist';
      }
    }

    if (packageInfo.type === 'backend') {
      if (packageInfo.buildTool === 'tsc') {
        return 'dist';
      }
    }

    return undefined;
  }

  private generateNotes(packageInfo: PackageInfo): string[] {
    const notes: string[] = [];

    if (packageInfo.nodeVersion) {
      notes.push(`Requires Node.js version: ${packageInfo.nodeVersion}`);
    }

    if (packageInfo.hasDatabase) {
      notes.push(
        `Database detected (${packageInfo.databaseType}). You'll need to set up a database instance.`
      );
    }

    if (packageInfo.requiredEnvVars.length > 0) {
      notes.push(
        `Environment variables required: ${packageInfo.requiredEnvVars.join(', ')}`
      );
    }

    if (packageInfo.type === 'frontend' && packageInfo.buildTool === 'vite') {
      notes.push('Vite build detected - deployment should be straightforward');
    }

    return notes;
  }
}
