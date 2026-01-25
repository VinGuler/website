import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SavedPackage, DeploymentRecord, PackageInfo } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', '..', 'data');
const PACKAGES_FILE = join(DATA_DIR, 'packages.json');
const DEPLOYMENTS_FILE = join(DATA_DIR, 'deployments.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Package operations
export async function getAllPackages(): Promise<SavedPackage[]> {
  try {
    await ensureDataDir();
    const data = await readFile(PACKAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

export async function savePackage(packageInfo: PackageInfo): Promise<SavedPackage> {
  const packages = await getAllPackages();

  // Check if package already exists (by name and path)
  const existingIndex = packages.findIndex(
    (p) => p.name === packageInfo.name && p.path === packageInfo.path
  );

  let savedPackage: SavedPackage;

  if (existingIndex >= 0) {
    // Update existing package
    savedPackage = {
      ...packages[existingIndex],
      ...packageInfo,
      scannedAt: new Date().toISOString(),
    };
    packages[existingIndex] = savedPackage;
  } else {
    // Create new package
    savedPackage = {
      ...packageInfo,
      id: generateId(),
      scannedAt: new Date().toISOString(),
      deploymentCount: 0,
    };
    packages.push(savedPackage);
  }

  await writeFile(PACKAGES_FILE, JSON.stringify(packages, null, 2));
  return savedPackage;
}

export async function getPackageById(id: string): Promise<SavedPackage | null> {
  const packages = await getAllPackages();
  return packages.find((p) => p.id === id) || null;
}

export async function updatePackageDeployment(packageId: string): Promise<void> {
  const packages = await getAllPackages();
  const packageIndex = packages.findIndex((p) => p.id === packageId);

  if (packageIndex >= 0) {
    packages[packageIndex].lastDeployedAt = new Date().toISOString();
    packages[packageIndex].deploymentCount++;
    await writeFile(PACKAGES_FILE, JSON.stringify(packages, null, 2));
  }
}

// Deployment operations
export async function getAllDeployments(): Promise<DeploymentRecord[]> {
  try {
    await ensureDataDir();
    const data = await readFile(DEPLOYMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

export async function saveDeployment(
  deployment: Omit<DeploymentRecord, 'id'>
): Promise<DeploymentRecord> {
  const deployments = await getAllDeployments();

  const newDeployment: DeploymentRecord = {
    ...deployment,
    id: generateId(),
  };

  deployments.push(newDeployment);
  await writeFile(DEPLOYMENTS_FILE, JSON.stringify(deployments, null, 2));

  return newDeployment;
}

export async function updateDeploymentStatus(
  id: string,
  updates: Partial<DeploymentRecord>
): Promise<void> {
  const deployments = await getAllDeployments();
  const deploymentIndex = deployments.findIndex((d) => d.id === id);

  if (deploymentIndex >= 0) {
    deployments[deploymentIndex] = {
      ...deployments[deploymentIndex],
      ...updates,
    };
    await writeFile(DEPLOYMENTS_FILE, JSON.stringify(deployments, null, 2));
  }
}

export async function getDeploymentsByPackage(packageId: string): Promise<DeploymentRecord[]> {
  const deployments = await getAllDeployments();
  return deployments.filter((d) => d.packageId === packageId);
}

export async function getLatestDeployment(packageId: string): Promise<DeploymentRecord | null> {
  const deployments = await getDeploymentsByPackage(packageId);
  if (deployments.length === 0) return null;

  // Sort by startedAt descending
  deployments.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return deployments[0];
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await ensureDataDir();
  await writeFile(PACKAGES_FILE, JSON.stringify([], null, 2));
  await writeFile(DEPLOYMENTS_FILE, JSON.stringify([], null, 2));
}
