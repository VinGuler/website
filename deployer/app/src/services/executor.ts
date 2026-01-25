import type { DeploymentConfig, DeploymentStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { validateDeploymentConfig } from '../utils/validator.js';
import { VercelAdapter } from './vendors/vercel.js';
import { RailwayAdapter } from './vendors/railway.js';
import { NetlifyAdapter } from './vendors/netlify.js';
import { RenderAdapter } from './vendors/render.js';
import * as dataService from './data.js';

export class Executor {
  async deploy(config: DeploymentConfig): Promise<DeploymentStatus> {
    logger.info(`Starting deployment for ${config.packageName} on ${config.vendor}`);

    // Validate configuration
    const validation = validateDeploymentConfig(config);
    if (!validation.valid) {
      const errorMsg = `Invalid deployment config: ${validation.errors.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Find the package
    const packages = await dataService.getAllPackages();
    const packageData = packages.find((p) => p.name === config.packageName);

    if (!packageData) {
      throw new Error(`Package ${config.packageName} not found`);
    }

    // Create deployment record
    const deploymentId = this.generateDeploymentId();
    const startedAt = new Date().toISOString();
    const logs: string[] = [];

    logs.push(`Starting deployment for ${config.packageName} on ${config.vendor}...`);

    // Save initial deployment record
    const deploymentRecord = await dataService.saveDeployment({
      packageId: packageData.id,
      packageName: config.packageName,
      vendor: config.vendor,
      status: 'pending',
      startedAt,
      logs,
      envVars: Object.keys(config.envVars || {}),
    });

    // Get vendor adapter
    const adapter = this.getVendorAdapter(config.vendor);

    try {
      // Validate vendor-specific requirements
      logs.push(`Validating ${config.vendor} configuration...`);
      await dataService.updateDeploymentStatus(deploymentRecord.id, { logs: [...logs] });

      const isValid = await adapter.validate(config);

      if (!isValid) {
        throw new Error(`${config.vendor} validation failed`);
      }

      // Execute deployment
      logs.push(`Deploying to ${config.vendor}...`);
      await dataService.updateDeploymentStatus(deploymentRecord.id, {
        status: 'deploying',
        logs: [...logs],
      });

      const result = await adapter.deploy(config);

      // Update deployment record
      logs.push(...result.logs);
      await dataService.updateDeploymentStatus(deploymentRecord.id, {
        status: result.status,
        completedAt: new Date().toISOString(),
        logs,
        deploymentUrl: result.deploymentUrl,
        error: result.error,
      });

      // Update package deployment stats
      if (result.status === 'success') {
        await dataService.updatePackageDeployment(packageData.id);
      }

      logger.info(
        `Deployment ${deploymentRecord.id} completed with status: ${result.status}`
      );

      // Return status in expected format
      const status: DeploymentStatus = {
        id: deploymentRecord.id,
        packageName: config.packageName,
        vendor: config.vendor,
        status: result.status,
        startedAt: new Date(startedAt),
        completedAt: new Date(),
        logs,
        deploymentUrl: result.deploymentUrl,
        error: result.error,
      };

      return status;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logs.push(`Deployment failed: ${errorMsg}`);

      await dataService.updateDeploymentStatus(deploymentRecord.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        logs,
        error: errorMsg,
      });

      logger.error(`Deployment ${deploymentRecord.id} failed: ${errorMsg}`);

      const status: DeploymentStatus = {
        id: deploymentRecord.id,
        packageName: config.packageName,
        vendor: config.vendor,
        status: 'failed',
        startedAt: new Date(startedAt),
        completedAt: new Date(),
        logs,
        error: errorMsg,
      };

      return status;
    }
  }

  getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    // This would need to be async now, but keeping signature for compatibility
    logger.warn('getDeploymentStatus called - consider using data service directly');
    return undefined;
  }

  getAllDeployments(): DeploymentStatus[] {
    // This would need to be async now, but keeping signature for compatibility
    logger.warn('getAllDeployments called - consider using data service directly');
    return [];
  }

  private getVendorAdapter(vendor: string) {
    switch (vendor) {
      case 'vercel':
        return new VercelAdapter();
      case 'railway':
        return new RailwayAdapter();
      case 'netlify':
        return new NetlifyAdapter();
      case 'render':
        return new RenderAdapter();
      default:
        throw new Error(`Unsupported vendor: ${vendor}`);
    }
  }

  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
