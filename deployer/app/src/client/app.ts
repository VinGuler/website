// API Base URL
const API_BASE = '';

// State
let packages: any[] = [];
let deploymentPlans: any[] = [];
let currentDeployment: any = null;

// DOM Elements
const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
const packagesList = document.getElementById('packages-list') as HTMLDivElement;
const plansList = document.getElementById('plans-list') as HTMLDivElement;
const packageSelect = document.getElementById('package-select') as HTMLSelectElement;
const vendorSelect = document.getElementById('vendor-select') as HTMLSelectElement;
const deployForm = document.getElementById('deploy-form') as HTMLFormElement;
const envVarsInputs = document.getElementById('env-vars-inputs') as HTMLDivElement;
const deploymentProgress = document.getElementById('deployment-progress') as HTMLDivElement;
const statusBadge = document.getElementById('status-badge') as HTMLDivElement;
const deploymentLogs = document.getElementById('deployment-logs') as HTMLDivElement;
const deploymentUrl = document.getElementById('deployment-url') as HTMLDivElement;
const historyList = document.getElementById('history-list') as HTMLDivElement;

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    if (!tabName) return;

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
    });
    document.getElementById(tabName)?.classList.add('active');

    // Load data if needed
    if (tabName === 'history') {
      loadDeploymentHistory();
    }
  });
});

// Scan Repository
scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';

  try {
    const response = await fetch(`${API_BASE}/api/scan`);
    const result = await response.json();

    if (result.success) {
      packages = result.data.packages;
      await loadDeploymentPlans();
      renderPackages();
      renderDeploymentPlans();
      populatePackageSelect();
    } else {
      alert(`Scan failed: ${result.error}`);
    }
  } catch (error) {
    alert(`Error scanning repository: ${error}`);
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan Repository';
  }
});

// Render Packages
function renderPackages() {
  if (packages.length === 0) {
    packagesList.innerHTML = '<p class="placeholder">No packages found</p>';
    return;
  }

  packagesList.innerHTML = packages
    .map(
      (pkg) => `
    <div class="package-card">
      <div class="package-name">${pkg.name}</div>
      <span class="package-type type-${pkg.type}">${pkg.type}</span>
      <div class="package-details">
        <div><strong>Framework:</strong> ${pkg.framework}</div>
        <div><strong>Build Tool:</strong> ${pkg.buildTool}</div>
        ${pkg.nodeVersion ? `<div><strong>Node:</strong> ${pkg.nodeVersion}</div>` : ''}
        ${pkg.hasDatabase ? `<div><strong>Database:</strong> ${pkg.databaseType}</div>` : ''}
      </div>
    </div>
  `
    )
    .join('');
}

// Load Deployment Plans
async function loadDeploymentPlans() {
  try {
    const response = await fetch(`${API_BASE}/api/deployment-plan`);
    const result = await response.json();

    if (result.success) {
      deploymentPlans = result.data;
    }
  } catch (error) {
    console.error('Error loading deployment plans:', error);
  }
}

// Render Deployment Plans
function renderDeploymentPlans() {
  if (deploymentPlans.length === 0) {
    plansList.innerHTML = '<p class="placeholder">No deployment plans available</p>';
    return;
  }

  plansList.innerHTML = deploymentPlans
    .map(
      (plan) => `
    <div class="plan-card">
      <div class="plan-header">
        <h3>${plan.packageName}</h3>
        <span class="package-type type-${plan.packageType}">${plan.packageType}</span>
      </div>

      ${plan.buildCommand ? `<div><strong>Build:</strong> ${plan.buildCommand}</div>` : ''}
      ${plan.outputDirectory ? `<div><strong>Output:</strong> ${plan.outputDirectory}</div>` : ''}

      ${plan.notes.length > 0 ? `<div style="margin-top: 10px;"><strong>Notes:</strong><ul style="margin-left: 20px;">${plan.notes.map((note: string) => `<li>${note}</li>`).join('')}</ul></div>` : ''}

      <div class="vendor-options">
        <h4>Deployment Options:</h4>
        ${plan.deploymentOptions
          .map(
            (option: any) => `
          <div class="vendor-option ${option.recommended ? 'recommended' : ''}">
            <div class="vendor-header">
              <span class="vendor-name">${option.vendorDisplayName}</span>
              ${option.recommended ? '<span class="recommended-badge">Recommended</span>' : ''}
            </div>
            <div class="cost">
              $${option.estimatedCost.min}-${option.estimatedCost.max} ${option.estimatedCost.currency}/${option.estimatedCost.period}
            </div>
            <div class="features">
              <ul>
                ${option.features.map((feature: string) => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
    )
    .join('');
}

// Populate Package Select
function populatePackageSelect() {
  packageSelect.innerHTML = '<option value="">-- Select a package --</option>';
  packages.forEach((pkg) => {
    const option = document.createElement('option');
    option.value = pkg.name;
    option.textContent = pkg.name;
    packageSelect.appendChild(option);
  });
}

// Package Selection Change
packageSelect.addEventListener('change', () => {
  const selectedPackage = packages.find((pkg) => pkg.name === packageSelect.value);
  if (!selectedPackage) {
    vendorSelect.innerHTML = '<option value="">-- Select a vendor --</option>';
    envVarsInputs.innerHTML = '';
    return;
  }

  const plan = deploymentPlans.find((p) => p.packageName === selectedPackage.name);
  if (!plan) return;

  // Populate vendor options
  vendorSelect.innerHTML = '<option value="">-- Select a vendor --</option>';
  plan.deploymentOptions.forEach((option: any) => {
    const opt = document.createElement('option');
    opt.value = option.vendor;
    opt.textContent = `${option.vendorDisplayName}${option.recommended ? ' (Recommended)' : ''}`;
    vendorSelect.appendChild(opt);
  });

  updateEnvVarInputs();
});

// Vendor Selection Change
vendorSelect.addEventListener('change', updateEnvVarInputs);

// Update Environment Variable Inputs
function updateEnvVarInputs() {
  const selectedPackage = packages.find((pkg) => pkg.name === packageSelect.value);
  const vendor = vendorSelect.value;

  if (!selectedPackage || !vendor) {
    envVarsInputs.innerHTML = '';
    return;
  }

  // Get required env vars for the vendor
  const vendorEnvVars = getVendorRequiredEnvVars(vendor);
  const packageEnvVars = selectedPackage.requiredEnvVars || [];
  const allEnvVars = [...new Set([...vendorEnvVars, ...packageEnvVars])];

  envVarsInputs.innerHTML = allEnvVars
    .map(
      (varName) => `
    <div class="env-var-input">
      <label for="env-${varName}">${varName}:</label>
      <input type="text" id="env-${varName}" name="${varName}" placeholder="Enter ${varName}">
    </div>
  `
    )
    .join('');
}

// Get Vendor Required Env Vars
function getVendorRequiredEnvVars(vendor: string): string[] {
  const vendorEnvVars: Record<string, string[]> = {
    vercel: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'],
    railway: ['RAILWAY_TOKEN'],
    netlify: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'],
    render: ['RENDER_API_KEY'],
  };

  return vendorEnvVars[vendor] || [];
}

// Deploy Form Submit
deployForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const packageName = packageSelect.value;
  const vendor = vendorSelect.value;

  if (!packageName || !vendor) {
    alert('Please select a package and vendor');
    return;
  }

  // Collect environment variables
  const envVars: Record<string, string> = {};
  const envInputs = envVarsInputs.querySelectorAll('input');
  envInputs.forEach((input) => {
    const inputEl = input as HTMLInputElement;
    envVars[inputEl.name] = inputEl.value;
  });

  const deploymentConfig = {
    packageName,
    vendor,
    envVars,
  };

  try {
    deploymentProgress.classList.remove('hidden');
    statusBadge.textContent = 'Deploying...';
    statusBadge.className = 'status-badge status-deploying';
    deploymentLogs.innerHTML = '<div class="log-entry">Starting deployment...</div>';
    deploymentUrl.classList.add('hidden');

    const response = await fetch(`${API_BASE}/api/deploy/${packageName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentConfig),
    });

    const result = await response.json();

    if (result.success) {
      currentDeployment = result.data;
      displayDeploymentStatus(result.data);
    } else {
      alert(`Deployment failed: ${result.error}`);
      statusBadge.textContent = 'Failed';
      statusBadge.className = 'status-badge status-failed';
    }
  } catch (error) {
    alert(`Error deploying: ${error}`);
    statusBadge.textContent = 'Failed';
    statusBadge.className = 'status-badge status-failed';
  }
});

// Display Deployment Status
function displayDeploymentStatus(status: any) {
  statusBadge.textContent = status.status;
  statusBadge.className = `status-badge status-${status.status}`;

  deploymentLogs.innerHTML = status.logs
    .map((log: string) => `<div class="log-entry">${log}</div>`)
    .join('');

  if (status.deploymentUrl) {
    deploymentUrl.classList.remove('hidden');
    deploymentUrl.innerHTML = `
      <strong>Deployment URL:</strong>
      <a href="${status.deploymentUrl}" target="_blank">${status.deploymentUrl}</a>
    `;
  }

  if (status.error) {
    deploymentLogs.innerHTML += `<div class="log-entry" style="color: #ff6b6b;">Error: ${status.error}</div>`;
  }
}

// Load Deployment History
async function loadDeploymentHistory() {
  try {
    const response = await fetch(`${API_BASE}/api/deployments`);
    const result = await response.json();

    if (result.success) {
      renderDeploymentHistory(result.data);
    }
  } catch (error) {
    console.error('Error loading deployment history:', error);
  }
}

// Render Deployment History
function renderDeploymentHistory(deployments: any[]) {
  if (deployments.length === 0) {
    historyList.innerHTML = '<p class="placeholder">No deployments yet</p>';
    return;
  }

  historyList.innerHTML = deployments
    .map(
      (deployment) => `
    <div class="history-item">
      <div class="history-header">
        <div>
          <strong>${deployment.packageName}</strong> on <strong>${deployment.vendor}</strong>
        </div>
        <span class="status-badge status-${deployment.status}">${deployment.status}</span>
      </div>
      <div class="timestamp">
        ${new Date(deployment.startedAt).toLocaleString()}
      </div>
      ${deployment.deploymentUrl ? `<div><a href="${deployment.deploymentUrl}" target="_blank">${deployment.deploymentUrl}</a></div>` : ''}
    </div>
  `
    )
    .join('');
}
