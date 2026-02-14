<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const auth = useAuthStore();
</script>

<template>
  <header class="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-bold text-slate-100">Finance Tracker</h1>
        <nav class="flex items-center gap-4">
          <RouterLink
            to="/"
            class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            active-class="!text-violet-400"
            >My Workspace</RouterLink
          >
          <RouterLink
            to="/shared"
            class="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            active-class="!text-violet-400"
            >Shared</RouterLink
          >
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-400">{{ auth.user?.displayName }}</span>
        <button
          class="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
          @click="auth.logout()"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
