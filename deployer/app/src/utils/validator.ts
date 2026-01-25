import type { DeploymentConfig } from '../types/index.js';
import { logger } from './logger.js';

export function validateDeploymentConfig(config: DeploymentConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.packageName || config.packageName.trim() === '') {
    errors.push('Package name is required');
  }

  if (!config.vendor) {
    errors.push('Vendor is required');
  }

  if (!config.envVars || typeof config.envVars !== 'object') {
    errors.push('Environment variables must be an object');
  }

  const valid = errors.length === 0;

  if (!valid) {
    logger.warn(`Deployment config validation failed: ${errors.join(', ')}`);
  }

  return { valid, errors };
}

export function validateEnvVars(
  required: string[],
  provided: Record<string, string>
): { valid: boolean; missing: string[] } {
  const missing = required.filter((key) => !provided[key] || provided[key].trim() === '');

  return {
    valid: missing.length === 0,
    missing,
  };
}
