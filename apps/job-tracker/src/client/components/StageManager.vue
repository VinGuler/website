<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApplicationStore, type Stage } from '@/stores/applications';
import StageItem from './StageItem.vue';

const props = defineProps<{ applicationId: number; stages: Stage[] }>();
const store = useApplicationStore();
const { t } = useI18n();

const newStageLabel = ref('');

async function addStage() {
  const label = newStageLabel.value.trim();
  if (!label) return;
  await store.addStage(props.applicationId, label);
  newStageLabel.value = '';
}

async function handleToggle(id: number) {
  await store.toggleStage(id);
}

async function handleUpdate(
  id: number,
  data: Partial<Pick<Stage, 'label' | 'notes' | 'scheduledAt'>>
) {
  await store.updateStage(id, data);
}

async function handleDelete(id: number) {
  await store.deleteStage(id);
}

const sortedStages = () => [...props.stages].sort((a, b) => a.order - b.order);
</script>

<template>
  <div class="space-y-2">
    <h3 class="text-sm font-semibold text-slate-300">{{ t('stages.title') }}</h3>

    <div v-if="sortedStages().length === 0" class="text-xs text-slate-500 py-2">
      {{ t('stages.noStages') }}
    </div>

    <div class="space-y-1.5">
      <StageItem
        v-for="stage in sortedStages()"
        :key="stage.id"
        :stage="stage"
        @toggle="handleToggle"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </div>

    <div class="flex gap-2 pt-1">
      <input
        v-model="newStageLabel"
        type="text"
        :placeholder="t('stages.addStage')"
        class="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @keyup.enter="addStage"
      />
      <button
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
        :disabled="!newStageLabel.trim()"
        @click="addStage"
      >
        Add
      </button>
    </div>
  </div>
</template>
