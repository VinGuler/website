<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/composables/useApi';
import ItemList from '@/components/ItemList.vue';
import type { CompletedCycle } from '@/types';
import { formatAmount, formatDate } from '@/utils';

const { t, locale } = useI18n();

const cycles = ref<CompletedCycle[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const deletingCycleId = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const cycleToDelete = ref<CompletedCycle | null>(null);

async function fetchCycles() {
  loading.value = true;
  error.value = null;

  const result = await api<CompletedCycle[]>('/api/workspace/cycles');

  if (result.success && result.data) {
    cycles.value = result.data;
  } else {
    error.value = result.error || 'Failed to load completed cycles';
  }

  loading.value = false;
}

function calculateBalanceCards(cycle: CompletedCycle) {
  const incomes = cycle.items.filter((i) => i.type === 'INCOME');
  const payments = cycle.items.filter((i) => i.type !== 'INCOME');

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalPayments = payments.reduce((sum, i) => sum + i.amount, 0);

  return {
    finalBalance: cycle.finalBalance,
    totalIncome,
    totalPayments,
    deficitExcess: totalIncome - totalPayments,
  };
}

function formatCycleLabel(cycleLabel: string): string {
  // Parse "YYYY-MM" format
  const [year, month] = cycleLabel.split('-').map(Number);
  const date = new Date(year!, month! - 1);
  return date.toLocaleDateString(locale.value, {
    month: 'long',
    year: 'numeric',
  });
}

function promptDelete(cycle: CompletedCycle) {
  cycleToDelete.value = cycle;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  cycleToDelete.value = null;
}

async function confirmDelete() {
  if (!cycleToDelete.value) return;

  const id = cycleToDelete.value.id;
  deletingCycleId.value = id;
  showDeleteConfirm.value = false;

  const result = await api(`/api/workspace/cycles/${id}`, { method: 'DELETE' });

  if (result.success) {
    cycles.value = cycles.value.filter((c) => c.id !== id);
  } else {
    error.value = result.error || 'Failed to delete cycle';
  }

  deletingCycleId.value = null;
  cycleToDelete.value = null;
}

const isEmpty = computed(() => cycles.value.length === 0);

onMounted(() => {
  fetchCycles();
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-100 mb-2">{{ t('cycles.title') }}</h1>
      <p class="text-sm text-slate-400">{{ t('cycles.subtitle') }}</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading && isEmpty" class="flex justify-center items-center py-20">
      <div class="text-center">
        <div
          class="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-3"
        ></div>
        <p class="text-slate-400">{{ t('cycles.loading') }}</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error && isEmpty" class="text-center py-20">
      <p class="text-rose-400 mb-4">{{ error }}</p>
      <button
        class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
        @click="fetchCycles"
      >
        {{ t('workspace.retry') }}
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="isEmpty"
      class="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-xl"
    >
      <div class="text-4xl mb-4 text-slate-600">&#128202;</div>
      <h3 class="text-lg font-semibold text-slate-300 mb-2">{{ t('cycles.noCycles') }}</h3>
      <p class="text-sm text-slate-500">
        {{ t('cycles.noCyclesDescription') }}
      </p>
    </div>

    <!-- Cycles list -->
    <div v-else class="space-y-6">
      <div
        v-for="cycle in cycles"
        :key="cycle.id"
        class="bg-slate-900 border border-slate-800 rounded-xl p-6"
        :class="{ 'opacity-50 pointer-events-none': deletingCycleId === cycle.id }"
      >
        <!-- Cycle header -->
        <div class="mb-4 pb-4 border-b border-slate-800 flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-100 mb-1">
              {{ formatCycleLabel(cycle.cycleLabel) }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ t('cycles.completedOn', { date: formatDate(cycle.createdAt, locale) }) }}
            </p>
          </div>
          <button
            :title="t('cycles.deleteCycle')"
            class="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            @click="promptDelete(cycle)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>

        <!-- Balance cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
            <div class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {{ t('cycles.finalBalance') }}
            </div>
            <div class="text-2xl font-bold text-slate-200 tabular-nums">
              {{ formatAmount(calculateBalanceCards(cycle).finalBalance, locale) }}
            </div>
          </div>

          <div class="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
            <div class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {{ t('cycles.totalIncome') }}
            </div>
            <div class="text-2xl font-bold text-emerald-400 tabular-nums">
              {{ formatAmount(calculateBalanceCards(cycle).totalIncome, locale) }}
            </div>
          </div>

          <div class="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
            <div class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
              {{ t('cycles.totalPayments') }}
            </div>
            <div class="text-2xl font-bold text-rose-400 tabular-nums">
              {{ formatAmount(calculateBalanceCards(cycle).totalPayments, locale) }}
            </div>
          </div>
        </div>

        <!-- Items list -->
        <div>
          <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            {{ t('cycles.items') }}
          </h3>
          <ItemList :items="cycle.items" :can-edit="false" />
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
        @click.self="cancelDelete"
      >
        <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full">
          <h3 class="text-lg font-semibold text-slate-100 mb-2">
            {{ t('cycles.deleteCycleTitle') }}
          </h3>
          <p class="text-sm text-slate-400 mb-6">
            {{ t('cycles.deleteCycleDescription') }}
          </p>
          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              @click="cancelDelete"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              class="px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
              @click="confirmDelete"
            >
              {{ t('cycles.deleteConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
