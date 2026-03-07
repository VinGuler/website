<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const auth = useAuthStore();
const { t } = useI18n();
</script>

<template>
  <header
    class="flex items-center justify-between px-4 lg:px-8 py-3 bg-slate-900 border-b border-slate-800"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-bold text-slate-100 tracking-tight">ApplyFlow</h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-sm text-slate-400">{{ auth.user?.displayName }}</span>
      <button
        class="px-3 py-1.5 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
        @click="auth.logout()"
      >
        {{ t('nav.logout') }}
      </button>
    </div>
  </header>
</template>
