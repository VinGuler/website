<template>
  <div class="package-card" :class="{ selected }" @click="$emit('click')">
    <div class="package-header">
      <div class="package-name">{{ package.name }}</div>
      <span class="package-type" :class="`type-${package.type}`">
        {{ package.type }}
      </span>
    </div>

    <div class="package-details">
      <div><strong>Framework:</strong> {{ package.framework }}</div>
      <div><strong>Build Tool:</strong> {{ package.buildTool }}</div>
      <div v-if="package.nodeVersion"><strong>Node:</strong> {{ package.nodeVersion }}</div>
      <div v-if="package.hasDatabase"><strong>Database:</strong> {{ package.databaseType }}</div>
    </div>

    <div v-if="package.latestDeployment" class="deployment-stats">
      <div class="stat-title">Latest Deployment</div>
      <div class="stat-row">
        <span class="stat-label">Vendor:</span>
        <span class="vendor-badge">{{ package.latestDeployment.vendor }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Status:</span>
        <span class="status-badge" :class="`status-${package.latestDeployment.status}`">
          {{ package.latestDeployment.status }}
        </span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Deployed:</span>
        <span>{{ formatDate(package.latestDeployment.deployedAt) }}</span>
      </div>
      <div v-if="package.latestDeployment.deploymentUrl" class="stat-row">
        <a
          :href="package.latestDeployment.deploymentUrl"
          target="_blank"
          class="deployment-link"
          @click.stop
        >
          View Deployment →
        </a>
      </div>
    </div>
    <div v-else class="deployment-stats">
      <div class="stat-title">Not Deployed Yet</div>
    </div>

    <div v-if="package.deploymentCount > 0" class="deployment-count">
      Total Deployments: {{ package.deploymentCount }}
    </div>

    <div v-if="!selected" class="click-hint">Click to view deployment options</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  package: any;
  selected: boolean;
}>();

defineEmits<{
  click: [];
}>();

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}
</script>

<style scoped>
.package-card {
  border: 2px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  background: #161b22;
}

.package-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.package-card.selected {
  border-color: #8b5cf6;
  background: #1e1b2e;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.package-name {
  font-size: 1.3em;
  font-weight: bold;
  color: #f0f6fc;
}

.package-type {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 600;
}

.type-frontend {
  background: #1e3a8a;
  color: #93c5fd;
}

.type-backend {
  background: #581c87;
  color: #d8b4fe;
}

.type-fullstack {
  background: #92400e;
  color: #fbbf24;
}

.package-details {
  font-size: 0.9em;
  color: #8b949e;
  margin-bottom: 15px;
}

.package-details div {
  margin: 4px 0;
}

.deployment-stats {
  background: #0d1117;
  border-radius: 6px;
  padding: 12px;
  margin-top: 15px;
  border-left: 3px solid #8b5cf6;
}

.stat-title {
  font-weight: 600;
  color: #f0f6fc;
  margin-bottom: 8px;
  font-size: 0.95em;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.9em;
}

.stat-label {
  color: #8b949e;
  min-width: 80px;
}

.vendor-badge {
  background: #8b5cf6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 600;
}

.status-success {
  background: #10b981;
  color: white;
}

.status-failed {
  background: #ef4444;
  color: white;
}

.status-pending,
.status-deploying {
  background: #fbbf24;
  color: #000;
}

.deployment-link {
  color: #8b5cf6;
  text-decoration: none;
  font-weight: 500;
}

.deployment-link:hover {
  text-decoration: underline;
}

.deployment-count {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #30363d;
  color: #8b949e;
  font-size: 0.85em;
  text-align: center;
}

.click-hint {
  margin-top: 12px;
  text-align: center;
  color: #6e7681;
  font-size: 0.85em;
  font-style: italic;
}
</style>
