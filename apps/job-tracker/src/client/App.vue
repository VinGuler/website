<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import AppHeader from '@/components/AppHeader.vue';

const auth = useAuthStore();
</script>

<template>
  <div class="min-h-screen">
    <AppHeader v-if="auth.isAuthenticated" />
    <main :class="auth.isAuthenticated ? 'px-4 py-4 lg:px-8' : ''">
      <RouterView />
    </main>
  </div>
</template>
