export type PackageType = 'frontend' | 'backend' | 'fullstack' | 'unknown';

export type BuildTool = 'vite' | 'webpack' | 'tsc' | 'esbuild' | 'rollup' | 'unknown';

export type Framework = 'vue' | 'react' | 'svelte' | 'express' | 'fastify' | 'nest' | 'unknown';

export type VendorName = 'vercel' | 'netlify' | 'cloudflare-pages' | 'railway' | 'render' | 'fly';

export interface PackageInfo {
  name: string;
  path: string;
  type: PackageType;
  framework: Framework;
  buildTool: BuildTool;
  nodeVersion?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  hasDatabase: boolean;
  databaseType?: string;
  requiredEnvVars: string[];
}

export interface DeploymentOption {
  vendor: VendorName;
  vendorDisplayName: string;
  recommended: boolean;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  features: string[];
  limitations?: string[];
  signupUrl: string;
  setupInstructions: string[];
}

export interface DeploymentPlan {
  packageName: string;
  packageType: PackageType;
  deploymentOptions: DeploymentOption[];
  buildCommand?: string;
  outputDirectory?: string;
  envVarsRequired: string[];
  notes: string[];
}

export interface DeploymentConfig {
  packageName: string;
  vendor: VendorName;
  envVars: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  customConfig?: Record<string, any>;
}

export interface DeploymentStatus {
  id: string;
  packageName: string;
  vendor: VendorName;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  logs: string[];
  error?: string;
  deploymentUrl?: string;
}

export interface ScanResult {
  packages: PackageInfo[];
  scannedAt: Date;
  repositoryRoot: string;
}

export interface VendorAdapter {
  name: VendorName;
  deploy(config: DeploymentConfig): Promise<DeploymentStatus>;
  validate(config: DeploymentConfig): Promise<boolean>;
  getRequiredEnvVars(): string[];
}

// Data persistence types (like SQL tables)
export interface SavedPackage extends PackageInfo {
  id: string; // unique identifier
  scannedAt: string; // ISO timestamp
  lastDeployedAt?: string; // ISO timestamp
  deploymentCount: number;
}

export interface DeploymentRecord {
  id: string; // unique identifier
  packageId: string; // foreign key to SavedPackage
  packageName: string; // denormalized for easier querying
  vendor: VendorName;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  logs: string[];
  error?: string;
  deploymentUrl?: string;
  envVars?: string[]; // just keys, not values (for security)
}
