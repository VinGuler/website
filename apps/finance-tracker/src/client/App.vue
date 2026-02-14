<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import AppHeader from '@/components/AppHeader.vue';

const auth = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-[#0c0f1a] text-slate-200">
    <AppHeader v-if="auth.isAuthenticated" />
    <main class="max-w-4xl mx-auto px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
