<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Stage } from '@/stores/applications';
import NotesEditor from './NotesEditor.vue';

const props = defineProps<{ stage: Stage }>();
const emit = defineEmits<{
  toggle: [id: number];
  update: [id: number, data: Partial<Pick<Stage, 'label' | 'notes' | 'scheduledAt'>>];
  delete: [id: number];
}>();

const { t } = useI18n();
const expanded = ref(false);
const editingLabel = ref(false);
const labelInput = ref(props.stage.label);
const scheduledInput = ref(props.stage.scheduledAt?.slice(0, 10) ?? '');

watch(
  () => props.stage.label,
  (v) => (labelInput.value = v)
);

function saveLabel() {
  if (labelInput.value && labelInput.value !== props.stage.label) {
    emit('update', props.stage.id, { label: labelInput.value });
  }
  editingLabel.value = false;
}

function saveScheduled() {
  const val = scheduledInput.value || null;
  emit('update', props.stage.id, { scheduledAt: val });
}

function saveNotes(notes: string) {
  emit('update', props.stage.id, { notes });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>

<template>
  <div class="border border-slate-700 rounded-lg bg-slate-800/50">
    <div class="flex items-center gap-2 px-3 py-2">
      <input
        type="checkbox"
        :checked="stage.isCompleted"
        class="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-blue-500 cursor-pointer"
        @change="emit('toggle', stage.id)"
      />

      <template v-if="editingLabel">
        <input
          v-model="labelInput"
          class="flex-1 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @keyup.enter="saveLabel"
          @blur="saveLabel"
        />
      </template>
      <template v-else>
        <span
          class="flex-1 text-sm cursor-pointer"
          :class="stage.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'"
          @dblclick="editingLabel = true"
        >
          {{ stage.label }}
        </span>
      </template>

      <span v-if="stage.scheduledAt" class="text-[10px] text-slate-500">
        {{ formatDate(stage.scheduledAt) }}
      </span>

      <button
        class="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        :title="t('stages.notes')"
        @click="expanded = !expanded"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>

      <button
        class="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
        @click="emit('delete', stage.id)"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div v-if="expanded" class="px-3 pb-3 space-y-2 border-t border-slate-700 pt-2">
      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-400">{{ t('stages.scheduledAt') }}:</label>
        <input
          v-model="scheduledInput"
          type="date"
          class="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @change="saveScheduled"
        />
      </div>
      <NotesEditor :notes="stage.notes ?? ''" @save="saveNotes" />
    </div>
  </div>
</template>
