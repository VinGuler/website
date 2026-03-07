<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Application } from '@/stores/applications';

const props = defineProps<{ application: Application }>();
const emit = defineEmits<{ select: [id: number] }>();
const { t } = useI18n();

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Find the scheduled date from the next uncompleted stage
const nextStageDate = (() => {
  const sorted = [...props.application.stages].sort((a, b) => a.order - b.order);
  const next = sorted.find((s) => !s.isCompleted);
  return next?.scheduledAt ?? null;
})();
</script>

<template>
  <div
    class="bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer hover:border-blue-500/50 hover:bg-slate-750 transition-colors group"
    @click="emit('select', application.id)"
  >
    <div class="flex items-start justify-between gap-2 mb-1.5">
      <h4 class="font-semibold text-slate-100 text-sm leading-tight truncate">
        {{ application.companyName }}
      </h4>
    </div>
    <p class="text-xs text-slate-400 mb-2 truncate">{{ application.role }}</p>
    <div v-if="application.nextStep" class="flex items-center gap-1.5">
      <span
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        :class="
          application.nextStep === t('board.pendingDecision')
            ? 'bg-slate-700 text-slate-400'
            : 'bg-blue-500/15 text-blue-400'
        "
      >
        <span class="text-[10px] line-height-[1.25]">{{ t('board.nextStep') }}:</span>
        <span class="line-height-[1.25]">{{ application.nextStep }}</span>
      </span>
      <span v-if="nextStageDate" class="text-[10px] text-slate-500">
        {{ formatDate(nextStageDate) }}
      </span>
    </div>
  </div>
</template>
