import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface Package {
  id: string;
  name: string;
  path: string;
  type: 'frontend' | 'backend' | 'fullstack';
  framework: string;
  buildTool: string;
  nodeVersion?: string;
  hasDatabase: boolean;
  databaseType?: string;
  requiredEnvVars: string[];
  scannedAt: string;
  deploymentCount: number;
  latestDeployment?: {
    vendor: string;
    status: string;
    deployedAt: string;
    deploymentUrl?: string;
  };
}

interface DeploymentPlan {
  packageName: string;
  packageType: string;
  buildCommand?: string;
  outputDirectory?: string;
  notes: string[];
  deploymentOptions: VendorOption[];
}

interface VendorOption {
  vendor: string;
  vendorDisplayName: string;
  recommended: boolean;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  features: string[];
  signupUrl: string;
  setupInstructions: string[];
}

export const useDeployerStore = defineStore('deployer', () => {
  const packages = ref<Package[]>([]);
  const deploymentPlans = ref<DeploymentPlan[]>([]);
  const selectedPackage = ref<Package | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedPlan = computed(() => {
    if (!selectedPackage.value) return null;
    return deploymentPlans.value.find(
      (p) => p.packageName === selectedPackage.value?.name
    );
  });

  async function loadPackages() {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/packages');
      const result = await response.json();
      if (result.success) {
        packages.value = result.data;
        // Load deployment plans if we have packages
        if (result.data.length > 0) {
          await loadDeploymentPlans();
        }
      } else {
        error.value = result.error;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load packages';
    } finally {
      loading.value = false;
    }
  }

  async function scanRepository() {
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/scan');
      const result = await response.json();
      if (result.success) {
        packages.value = result.data.packages;
        await loadDeploymentPlans();
      } else {
        error.value = result.error;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to scan repository';
    } finally {
      loading.value = false;
    }
  }

  async function loadDeploymentPlans() {
    try {
      const response = await fetch('/api/deployment-plan');
      const result = await response.json();
      if (result.success) {
        deploymentPlans.value = result.data;
      }
    } catch (e) {
      console.error('Failed to load deployment plans:', e);
    }
  }

  async function clearAllData() {
    const confirmed = confirm(
      'Are you sure you want to clear all data? This will delete all packages and deployment history.'
    );
    if (!confirmed) return;

    loading.value = true;
    error.value = null;
    try {
      const response = await fetch('/api/data', { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        packages.value = [];
        deploymentPlans.value = [];
        selectedPackage.value = null;
      } else {
        error.value = result.error;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clear data';
    } finally {
      loading.value = false;
    }
  }

  function selectPackage(pkg: Package | null) {
    // Toggle selection - if clicking the same package, deselect it
    if (selectedPackage.value?.id === pkg?.id) {
      selectedPackage.value = null;
    } else {
      selectedPackage.value = pkg;
    }
    console.log('Selected package:', selectedPackage.value?.name || 'none');
    console.log('Selected plan:', selectedPlan.value?.packageName || 'none');
  }

  return {
    packages,
    deploymentPlans,
    selectedPackage,
    selectedPlan,
    loading,
    error,
    loadPackages,
    scanRepository,
    loadDeploymentPlans,
    clearAllData,
    selectPackage,
  };
});
