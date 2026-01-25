<template>
  <div class="app">
    <header>
      <h1>🚀 Monorepo Deployer</h1>
      <p class="subtitle">Automated deployment tool for your monorepo packages</p>
    </header>

    <div class="container">
      <div class="section">
        <div class="section-header">
          <h2>Detected Packages</h2>
          <div class="header-buttons">
            <button @click="store.clearAllData()" class="btn btn-danger">
              Clear All Data
            </button>
            <button @click="store.scanRepository()" class="btn btn-primary" :disabled="store.loading">
              {{ store.loading ? 'Scanning...' : 'Scan Repository' }}
            </button>
          </div>
        </div>

        <div v-if="store.error" class="error-message">
          {{ store.error }}
        </div>

        <div v-if="store.packages.length === 0" class="placeholder">
          Click "Scan Repository" to detect packages
        </div>

        <div v-else class="packages-grid">
          <PackageCard
            v-for="pkg in store.packages"
            :key="pkg.id"
            :package="pkg"
            :selected="store.selectedPackage?.id === pkg.id"
            @click="store.selectPackage(pkg)"
          />
        </div>

        <transition name="expand">
          <div v-if="store.selectedPackage && store.selectedPlan" class="expanded-section">
            <VendorOptions
              :plan="store.selectedPlan"
              :package="store.selectedPackage"
            />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useDeployerStore } from './stores/deployer';
import PackageCard from './components/PackageCard.vue';
import VendorOptions from './components/VendorOptions.vue';

const store = useDeployerStore();

onMounted(() => {
  store.loadPackages();
});
</script>

<style scoped>
.app {
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.1em;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.section {
  background: #161b22;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  border: 1px solid #30363d;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section h2 {
  color: #f0f6fc;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #8b5cf6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.error-message {
  background: #7f1d1d;
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.placeholder {
  text-align: center;
  color: #6e7681;
  padding: 40px;
  font-style: italic;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.expanded-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #30363d;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
