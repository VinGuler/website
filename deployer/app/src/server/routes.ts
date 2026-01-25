import { Router } from 'express';
import { Scanner } from '../services/scanner.js';
import { Analyzer } from '../services/analyzer.js';
import { Planner } from '../services/planner.js';
import { Executor } from '../services/executor.js';
import type { DeploymentConfig } from '../types/index.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get repository root (go up from deployer/app/src/server to project root)
const REPOSITORY_ROOT = join(__dirname, '..', '..', '..', '..');

const router = Router();
const scanner = new Scanner(REPOSITORY_ROOT);
const analyzer = new Analyzer();
const planner = new Planner();
const executor = new Executor();

// In-memory cache for scan results
let cachedScanResult: any = null;
let cachedDeploymentPlans: any = null;

// GET /api/scan - Scan packages and return analysis
router.get('/api/scan', async (req, res) => {
  try {
    const scanResult = await scanner.scan();
    const analyzedPackages = await Promise.all(
      scanResult.packages.map((pkg) => analyzer.analyze(pkg))
    );

    cachedScanResult = {
      ...scanResult,
      packages: analyzedPackages,
    };

    // Generate deployment plans
    cachedDeploymentPlans = analyzedPackages.map((pkg) => planner.generatePlan(pkg));

    res.json({
      success: true,
      data: cachedScanResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/packages - Get detected packages
router.get('/api/packages', async (req, res) => {
  try {
    if (!cachedScanResult) {
      // Trigger scan if not cached
      const scanResult = await scanner.scan();
      const analyzedPackages = await Promise.all(
        scanResult.packages.map((pkg) => analyzer.analyze(pkg))
      );

      cachedScanResult = {
        ...scanResult,
        packages: analyzedPackages,
      };
    }

    res.json({
      success: true,
      data: cachedScanResult.packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/deployment-plan - Get deployment plans
router.get('/api/deployment-plan', async (req, res) => {
  try {
    if (!cachedDeploymentPlans) {
      // Generate plans if not cached
      if (!cachedScanResult) {
        const scanResult = await scanner.scan();
        const analyzedPackages = await Promise.all(
          scanResult.packages.map((pkg) => analyzer.analyze(pkg))
        );
        cachedScanResult = {
          ...scanResult,
          packages: analyzedPackages,
        };
      }

      cachedDeploymentPlans = cachedScanResult.packages.map((pkg: any) =>
        planner.generatePlan(pkg)
      );
    }

    res.json({
      success: true,
      data: cachedDeploymentPlans,
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
router.get('/api/deployments', (req, res) => {
  try {
    const deployments = executor.getAllDeployments();

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

export default router;
