<script setup lang="ts">
import type { Application } from '@/stores/applications';
import ApplicationCard from './ApplicationCard.vue';

defineProps<{
  title: string;
  applications: Application[];
  colorClass?: string;
}>();

const emit = defineEmits<{ select: [id: number] }>();
</script>

<template>
  <div class="flex flex-col min-w-[260px] max-w-[320px] flex-1">
    <div class="flex items-center gap-2 mb-3 px-1">
      <div class="w-2 h-2 rounded-full" :class="colorClass || 'bg-slate-500'" />
      <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">{{ title }}</h3>
      <span class="text-xs text-slate-500 ml-auto">{{ applications.length }}</span>
    </div>
    <div
      class="flex flex-col gap-2 min-h-[100px] p-2 bg-slate-900/50 rounded-lg border border-slate-800/50"
    >
      <ApplicationCard
        v-for="app in applications"
        :key="app.id"
        :application="app"
        @select="emit('select', $event)"
      />
      <p v-if="applications.length === 0" class="text-xs text-slate-600 text-center py-8">
        No applications
      </p>
    </div>
  </div>
</template>
