import { Router } from 'express';
import { Scanner } from '../services/scanner.js';
import { Analyzer } from '../services/analyzer.js';
import { Planner } from '../services/planner.js';
import { Executor } from '../services/executor.js';
import * as dataService from '../services/data.js';
import type { DeploymentConfig } from '../types/index.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get repository root (go up from deployer/app/src/server to project root)
const REPOSITORY_ROOT = join(__dirname, '..', '..', '..', '..');

const router = Router();
const scanner = new Scanner(REPOSITORY_ROOT);
const analyzer = new Analyzer();
const planner = new Planner();
const executor = new Executor();

// GET /api/scan - Scan packages and return analysis
router.get('/api/scan', async (req, res) => {
  try {
    const scanResult = await scanner.scan();
    const analyzedPackages = await Promise.all(
      scanResult.packages.map((pkg) => analyzer.analyze(pkg))
    );

    // Save each package to disk
    for (const analyzedPackage of analyzedPackages) {
      await dataService.savePackage(analyzedPackage);
    }

    const savedPackages = await dataService.getAllPackages();

    res.json({
      success: true,
      data: {
        packages: savedPackages,
        scannedAt: scanResult.scannedAt,
        repositoryRoot: scanResult.repositoryRoot,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/packages - Get all saved packages with deployment stats
router.get('/api/packages', async (req, res) => {
  try {
    const packages = await dataService.getAllPackages();

    // Enhance with deployment stats
    const packagesWithStats = await Promise.all(
      packages.map(async (pkg) => {
        const latestDeployment = await dataService.getLatestDeployment(pkg.id);
        return {
          ...pkg,
          latestDeployment: latestDeployment
            ? {
                vendor: latestDeployment.vendor,
                status: latestDeployment.status,
                deployedAt: latestDeployment.completedAt || latestDeployment.startedAt,
                deploymentUrl: latestDeployment.deploymentUrl,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: packagesWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/deployment-plan - Get deployment plans for all packages
router.get('/api/deployment-plan', async (req, res) => {
  try {
    const packages = await dataService.getAllPackages();
    const deploymentPlans = packages.map((pkg) => planner.generatePlan(pkg));

    res.json({
      success: true,
      data: deploymentPlans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/deploy/:packageName - Execute deployment
router.post('/api/deploy/:packageName', async (req, res) => {
  try {
    const { packageName } = req.params;
    const deploymentConfig: DeploymentConfig = req.body;

    if (!deploymentConfig || !deploymentConfig.vendor) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment configuration',
      });
    }

    const status = await executor.deploy(deploymentConfig);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/deployment-status/:id - Check deployment status
router.get('/api/deployment-status/:id', (req, res) => {
  try {
    const { id } = req.params;
    const status = executor.getDeploymentStatus(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/deployments - Get all deployments
router.get('/api/deployments', async (req, res) => {
  try {
    const deployments = await dataService.getAllDeployments();

    // Sort by most recent first
    deployments.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    res.json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/data - Clear all data
router.delete('/api/data', async (req, res) => {
  try {
    await dataService.clearAllData();
    logger.info('All data cleared');

    res.json({
      success: true,
      message: 'All data cleared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
