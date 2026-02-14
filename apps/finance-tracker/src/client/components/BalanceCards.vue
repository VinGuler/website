<script setup lang="ts">
defineProps<{
  currentBalance: number;
  expectedBalance: number;
  deficitExcess: number;
  canEdit: boolean;
}>();

defineEmits<{
  'update-balance': [];
}>();

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <!-- Current Balance -->
    <div class="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
      <p class="text-sm font-medium text-emerald-400 mb-1">Current Balance</p>
      <div class="flex items-center gap-2">
        <p class="text-2xl font-bold text-emerald-300">{{ formatNumber(currentBalance) }}</p>
        <button
          v-if="canEdit"
          class="text-emerald-500 hover:text-emerald-300 transition-colors"
          title="Edit balance"
          @click="$emit('update-balance')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Expected Balance -->
    <div class="bg-sky-950/40 border border-sky-800/40 rounded-xl p-4">
      <p class="text-sm font-medium text-sky-400 mb-1">Expected Balance</p>
      <p class="text-2xl font-bold text-sky-300">{{ formatNumber(expectedBalance) }}</p>
    </div>

    <!-- Deficit / Excess -->
    <div
      :class="[
        'rounded-xl p-4 border',
        deficitExcess >= 0
          ? 'bg-emerald-950/40 border-emerald-800/40'
          : 'bg-rose-950/40 border-rose-800/40',
      ]"
    >
      <p
        :class="[
          'text-sm font-medium mb-1',
          deficitExcess >= 0 ? 'text-emerald-400' : 'text-rose-400',
        ]"
      >
        {{ deficitExcess >= 0 ? 'Surplus' : 'Deficit' }}
      </p>
      <p :class="['text-2xl font-bold', deficitExcess >= 0 ? 'text-emerald-300' : 'text-rose-300']">
        {{ formatNumber(Math.abs(deficitExcess)) }}
      </p>
    </div>
  </div>
</template>
