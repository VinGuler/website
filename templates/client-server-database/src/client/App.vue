<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import logo from './assets/logo.png';

const auth = useAuthStore();
const { t } = useI18n();
</script>

<template>
  <div class="app">
    <header v-if="auth.isAuthenticated" class="app-header">
      <div class="header-left">
        <img :src="logo" alt="Logo" class="logo" />
        <h1>Client-Server-Database</h1>
      </div>
      <div class="header-right">
        <span class="user-name">{{ auth.user?.displayName }}</span>
        <button class="logout-btn" @click="auth.logout()">{{ t('nav.logout') }}</button>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  max-width: 640px;
  margin: 0 auto;
  font-family: system-ui, sans-serif;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  width: 32px;
  height: 32px;
}

h1 {
  margin: 0;
  font-size: 1.25rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  color: #666;
  font-size: 0.9rem;
}

.logout-btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333;
}

.logout-btn:hover {
  background: #f5f5f5;
}

.main-content {
  padding: 1rem 0;
}
</style>
