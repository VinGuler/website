<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApplicationStore } from '@/stores/applications';
import KanbanColumn from '@/components/KanbanColumn.vue';
import ApplicationDetail from '@/components/ApplicationDetail.vue';
import SearchFilter from '@/components/SearchFilter.vue';

const store = useApplicationStore();
const { t } = useI18n();

const showAddForm = ref(false);
const newCompany = ref('');
const newRole = ref('');

onMounted(() => {
  store.fetchApplications();
});

async function addApplication() {
  const companyName = newCompany.value.trim();
  const role = newRole.value.trim();
  if (!companyName || !role) return;

  await store.createApplication({ companyName, role });
  newCompany.value = '';
  newRole.value = '';
  showAddForm.value = false;
}

function selectApplication(id: number) {
  store.activeApplicationId = id;
}

function closeDetail() {
  store.activeApplicationId = null;
}

const columns = [
  { key: 'APPLIED' as const, title: t('board.applied'), color: 'bg-blue-500' },
  { key: 'IN_PROGRESS' as const, title: t('board.inProgress'), color: 'bg-amber-500' },
  { key: 'OFFER' as const, title: t('board.offer'), color: 'bg-green-500' },
  { key: 'ARCHIVED' as const, title: t('board.archived'), color: 'bg-slate-500' },
];
</script>

<template>
  <div>
    <!-- Top bar -->
    <div class="flex items-center gap-4 mb-6 flex-wrap">
      <h2 class="text-xl font-bold text-slate-100">{{ t('board.title') }}</h2>
      <div class="flex-1 max-w-xs">
        <SearchFilter v-model="store.searchQuery" />
      </div>
      <button
        class="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors cursor-pointer"
        @click="showAddForm = !showAddForm"
      >
        + {{ t('board.addApplication') }}
      </button>
    </div>

    <!-- Quick-add form -->
    <div
      v-if="showAddForm"
      class="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-lg flex gap-3 items-end flex-wrap"
    >
      <div class="flex-1 min-w-[180px]">
        <label class="block text-xs text-slate-400 mb-1">{{ t('application.companyName') }}</label>
        <input
          v-model="newCompany"
          type="text"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :placeholder="t('application.companyName')"
          @keyup.enter="addApplication"
        />
      </div>
      <div class="flex-1 min-w-[180px]">
        <label class="block text-xs text-slate-400 mb-1">{{ t('application.role') }}</label>
        <input
          v-model="newRole"
          type="text"
          class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :placeholder="t('application.role')"
          @keyup.enter="addApplication"
        />
      </div>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
          :disabled="!newCompany.trim() || !newRole.trim()"
          @click="addApplication"
        >
          Add
        </button>
        <button
          class="px-4 py-2 text-sm border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          @click="showAddForm = false"
        >
          {{ t('application.cancel') }}
        </button>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="flex gap-4 overflow-x-auto pb-4">
      <KanbanColumn
        v-for="col in columns"
        :key="col.key"
        :title="col.title"
        :applications="store.applicationsByStatus[col.key]"
        :color-class="col.color"
        @select="selectApplication"
      />
    </div>

    <!-- Application detail slide-over -->
    <ApplicationDetail
      v-if="store.activeApplication"
      :application="store.activeApplication"
      @close="closeDetail"
    />
  </div>
</template>
