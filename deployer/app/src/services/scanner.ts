import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { ScanResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class Scanner {
  private repositoryRoot: string;
  private packagesDir: string;

  constructor(repositoryRoot: string) {
    this.repositoryRoot = resolve(repositoryRoot);
    this.packagesDir = join(this.repositoryRoot, 'packages');
  }

  async scan(): Promise<ScanResult> {
    logger.info(`Scanning packages directory: ${this.packagesDir}`);

    try {
      const packageDirs = await this.getPackageDirectories();
      const packages = await Promise.all(packageDirs.map((dir) => this.readPackageInfo(dir)));

      const validPackages = packages.filter((pkg) => pkg !== null);

      logger.info(`Found ${validPackages.length} packages`);

      return {
        packages: validPackages,
        scannedAt: new Date(),
        repositoryRoot: this.repositoryRoot,
      };
    } catch (error) {
      logger.error(`Failed to scan packages: ${error}`);
      throw error;
    }
  }

  private async getPackageDirectories(): Promise<string[]> {
    try {
      const entries = await readdir(this.packagesDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(this.packagesDir, entry.name));
    } catch (error) {
      logger.error(`Failed to read packages directory: ${error}`);
      return [];
    }
  }

  private async readPackageInfo(packagePath: string): Promise<any> {
    try {
      const packageJsonPath = join(packagePath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      return {
        name: packageJson.name || 'unknown',
        path: packagePath,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {},
        nodeVersion: packageJson.engines?.node,
        packageJson,
      };
    } catch (error) {
      logger.warn(`Failed to read package at ${packagePath}: ${error}`);
      return null;
    }
  }
}
