import type { DeploymentConfig, DeploymentStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { validateDeploymentConfig } from '../utils/validator.js';
import { VercelAdapter } from './vendors/vercel.js';
import { RailwayAdapter } from './vendors/railway.js';
import { NetlifyAdapter } from './vendors/netlify.js';
import { RenderAdapter } from './vendors/render.js';

export class Executor {
  private deployments: Map<string, DeploymentStatus> = new Map();

  async deploy(config: DeploymentConfig): Promise<DeploymentStatus> {
    logger.info(`Starting deployment for ${config.packageName} on ${config.vendor}`);

    // Validate configuration
    const validation = validateDeploymentConfig(config);
    if (!validation.valid) {
      const errorMsg = `Invalid deployment config: ${validation.errors.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Create deployment status
    const deploymentId = this.generateDeploymentId();
    const status: DeploymentStatus = {
      id: deploymentId,
      packageName: config.packageName,
      vendor: config.vendor,
      status: 'pending',
      startedAt: new Date(),
      logs: [],
    };

    this.deployments.set(deploymentId, status);

    // Get vendor adapter
    const adapter = this.getVendorAdapter(config.vendor);

    try {
      // Validate vendor-specific requirements
      status.logs.push(`Validating ${config.vendor} configuration...`);
      const isValid = await adapter.validate(config);

      if (!isValid) {
        throw new Error(`${config.vendor} validation failed`);
      }

      // Execute deployment
      status.status = 'deploying';
      status.logs.push(`Deploying to ${config.vendor}...`);
      this.deployments.set(deploymentId, { ...status });

      const result = await adapter.deploy(config);

      // Update status
      status.status = result.status;
      status.completedAt = new Date();
      status.logs = [...status.logs, ...result.logs];
      status.deploymentUrl = result.deploymentUrl;
      status.error = result.error;

      this.deployments.set(deploymentId, status);

      logger.info(
        `Deployment ${deploymentId} completed with status: ${status.status}`
      );

      return status;
    } catch (error) {
      status.status = 'failed';
      status.completedAt = new Date();
      status.error = error instanceof Error ? error.message : String(error);
      status.logs.push(`Deployment failed: ${status.error}`);
      this.deployments.set(deploymentId, status);

      logger.error(`Deployment ${deploymentId} failed: ${status.error}`);

      return status;
    }
  }

  getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.deployments.get(deploymentId);
  }

  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values());
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
