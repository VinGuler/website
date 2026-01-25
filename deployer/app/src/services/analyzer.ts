import type {
  PackageInfo,
  PackageType,
  Framework,
  BuildTool,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

export class Analyzer {
  async analyze(scannedPackage: any): Promise<PackageInfo> {
    logger.debug(`Analyzing package: ${scannedPackage.name}`);

    const type = this.detectPackageType(scannedPackage);
    const framework = this.detectFramework(scannedPackage);
    const buildTool = this.detectBuildTool(scannedPackage);
    const { hasDatabase, databaseType } = this.detectDatabase(scannedPackage);
    const requiredEnvVars = await this.detectEnvVars(scannedPackage.path);

    return {
      name: scannedPackage.name,
      path: scannedPackage.path,
      type,
      framework,
      buildTool,
      nodeVersion: scannedPackage.nodeVersion,
      dependencies: scannedPackage.dependencies,
      devDependencies: scannedPackage.devDependencies,
      scripts: scannedPackage.scripts,
      hasDatabase,
      databaseType,
      requiredEnvVars,
    };
  }

  private detectPackageType(pkg: any): PackageType {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const hasFrontendFramework = ['vue', 'react', 'svelte', 'angular'].some(
      (fw) => deps[fw]
    );
    const hasVite = deps['vite'] || deps['@vitejs/plugin-vue'];
    const hasBackendFramework = ['express', 'fastify', '@nestjs/core'].some(
      (fw) => deps[fw]
    );

    if (hasFrontendFramework || hasVite) {
      if (hasBackendFramework) {
        return 'fullstack';
      }
      return 'frontend';
    }

    if (hasBackendFramework) {
      return 'backend';
    }

    // Check scripts for clues
    const scripts = pkg.scripts || {};
    if (scripts.dev?.includes('vite') || scripts.build?.includes('vite')) {
      return 'frontend';
    }

    if (scripts.dev?.includes('tsx') || scripts.dev?.includes('node')) {
      return 'backend';
    }

    return 'unknown';
  }

  private detectFramework(pkg: any): Framework {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['vue']) return 'vue';
    if (deps['react']) return 'react';
    if (deps['svelte']) return 'svelte';
    if (deps['express']) return 'express';
    if (deps['fastify']) return 'fastify';
    if (deps['@nestjs/core']) return 'nest';

    return 'unknown';
  }

  private detectBuildTool(pkg: any): BuildTool {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const scripts = pkg.scripts || {};

    if (deps['vite'] || scripts.build?.includes('vite')) return 'vite';
    if (deps['webpack'] || scripts.build?.includes('webpack')) return 'webpack';
    if (deps['esbuild'] || scripts.build?.includes('esbuild')) return 'esbuild';
    if (deps['rollup'] || scripts.build?.includes('rollup')) return 'rollup';
    if (scripts.build?.includes('tsc')) return 'tsc';

    return 'unknown';
  }

  private detectDatabase(pkg: any): { hasDatabase: boolean; databaseType?: string } {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['pg'] || deps['postgres']) return { hasDatabase: true, databaseType: 'postgresql' };
    if (deps['mysql'] || deps['mysql2']) return { hasDatabase: true, databaseType: 'mysql' };
    if (deps['mongodb'] || deps['mongoose']) return { hasDatabase: true, databaseType: 'mongodb' };
    if (deps['sqlite3'] || deps['better-sqlite3'])
      return { hasDatabase: true, databaseType: 'sqlite' };
    if (deps['@prisma/client']) return { hasDatabase: true, databaseType: 'prisma' };

    return { hasDatabase: false };
  }

  private async detectEnvVars(packagePath: string): Promise<string[]> {
    const envVars: Set<string> = new Set();

    try {
      // Try to read common source files to detect environment variables
      const possibleFiles = [
        'src/index.ts',
        'src/index.js',
        'src/main.ts',
        'src/main.js',
        'src/server/index.ts',
        'src/app.ts',
      ];

      for (const file of possibleFiles) {
        try {
          const content = await readFile(join(packagePath, file), 'utf-8');
          // Look for process.env.VARIABLE_NAME patterns
          const regex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
          let match;
          while ((match = regex.exec(content)) !== null) {
            envVars.add(match[1]);
          }
        } catch {
          // File doesn't exist, continue
        }
      }
    } catch (error) {
      logger.debug(`Could not detect env vars for ${packagePath}: ${error}`);
    }

    return Array.from(envVars);
  }
}
