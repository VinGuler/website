<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApplicationStore, type Application } from '@/stores/applications';
import StageManager from './StageManager.vue';

const props = defineProps<{ application: Application }>();
const emit = defineEmits<{ close: [] }>();

const store = useApplicationStore();
const { t } = useI18n();

const editing = ref(false);
const form = ref({
  companyName: '',
  role: '',
  status: '' as Application['status'],
  salaryRange: '',
  jobLink: '',
  companyUrl: '',
  description: '',
});

watch(
  () => props.application,
  (app) => {
    form.value = {
      companyName: app.companyName,
      role: app.role,
      status: app.status,
      salaryRange: app.salaryRange ?? '',
      jobLink: app.jobLink ?? '',
      companyUrl: app.companyUrl ?? '',
      description: app.description ?? '',
    };
  },
  { immediate: true }
);

const statuses: { value: Application['status']; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'GHOSTED', label: 'Ghosted' },
  { value: 'ARCHIVED', label: 'Archived' },
];

async function save() {
  await store.updateApplication(props.application.id, {
    companyName: form.value.companyName,
    role: form.value.role,
    status: form.value.status,
    salaryRange: form.value.salaryRange || null,
    jobLink: form.value.jobLink || null,
    companyUrl: form.value.companyUrl || null,
    description: form.value.description || null,
  });
  editing.value = false;
}

async function handleStatusChange(status: Application['status']) {
  form.value.status = status;
  await store.updateApplication(props.application.id, { status });
}

async function handleDelete() {
  if (!confirm(t('application.confirmDelete'))) return;
  await store.deleteApplication(props.application.id);
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <!-- Slide-over panel -->
    <div
      class="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 overflow-y-auto shadow-2xl"
    >
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <template v-if="editing">
              <input
                v-model="form.companyName"
                class="w-full mb-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-lg font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                v-model="form.role"
                class="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </template>
            <template v-else>
              <h2
                class="text-lg font-bold text-slate-100 truncate cursor-pointer"
                @dblclick="editing = true"
              >
                {{ application.companyName }}
              </h2>
              <p class="text-sm text-slate-400 cursor-pointer" @dblclick="editing = true">
                {{ application.role }}
              </p>
            </template>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Status -->
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="s in statuses"
            :key="s.value"
            class="px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer"
            :class="
              form.status === s.value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
            "
            @click="handleStatusChange(s.value)"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- Details -->
        <div class="space-y-3">
          <div v-if="editing || form.salaryRange" class="space-y-1">
            <label class="text-xs text-slate-500">{{ t('application.salaryRange') }}</label>
            <input
              v-if="editing"
              v-model="form.salaryRange"
              class="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p v-else class="text-sm text-slate-300">{{ form.salaryRange }}</p>
          </div>

          <div v-if="editing || form.jobLink" class="space-y-1">
            <label class="text-xs text-slate-500">{{ t('application.jobLink') }}</label>
            <input
              v-if="editing"
              v-model="form.jobLink"
              type="url"
              class="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <a
              v-else
              :href="form.jobLink"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-400 hover:underline block truncate"
            >
              {{ form.jobLink }}
            </a>
          </div>

          <div v-if="editing || form.companyUrl" class="space-y-1">
            <label class="text-xs text-slate-500">{{ t('application.companyUrl') }}</label>
            <input
              v-if="editing"
              v-model="form.companyUrl"
              type="url"
              class="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <a
              v-else
              :href="form.companyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-400 hover:underline block truncate"
            >
              {{ form.companyUrl }}
            </a>
          </div>

          <div v-if="editing || form.description" class="space-y-1">
            <label class="text-xs text-slate-500">{{ t('application.description') }}</label>
            <textarea
              v-if="editing"
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            />
            <p v-else class="text-sm text-slate-300 whitespace-pre-wrap">{{ form.description }}</p>
          </div>
        </div>

        <!-- Edit/Save actions -->
        <div class="flex gap-2">
          <template v-if="editing">
            <button
              class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
              @click="save"
            >
              {{ t('application.save') }}
            </button>
            <button
              class="px-4 py-1.5 text-sm border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              @click="editing = false"
            >
              {{ t('application.cancel') }}
            </button>
          </template>
          <template v-else>
            <button
              class="px-4 py-1.5 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              @click="editing = true"
            >
              Edit Details
            </button>
          </template>
          <button
            class="ml-auto px-4 py-1.5 text-sm text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/20 transition-colors cursor-pointer"
            @click="handleDelete"
          >
            {{ t('application.delete') }}
          </button>
        </div>

        <!-- Divider -->
        <hr class="border-slate-800" />

        <!-- Stage Manager -->
        <StageManager :application-id="application.id" :stages="application.stages" />
      </div>
    </div>
  </div>
</template>
