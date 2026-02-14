<script setup lang="ts">
import { computed } from 'vue';
import type { Item } from '@/types';
import { ITEM_TYPE_LABELS, ITEM_TYPE_IS_INCOME } from '@/types';

const props = defineProps<{
  items: Item[];
  canEdit: boolean;
}>();

defineEmits<{
  'toggle-paid': [itemId: string];
  edit: [item: Item];
  delete: [itemId: string];
}>();

const sortedItems = computed(() => [...props.items].sort((a, b) => a.dayOfMonth - b.dayOfMonth));

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function typeBadgeClass(type: Item['type']): string {
  if (ITEM_TYPE_IS_INCOME[type]) {
    return 'bg-emerald-900/50 text-emerald-400';
  }
  switch (type) {
    case 'CREDIT_CARD':
      return 'bg-amber-900/50 text-amber-400';
    case 'LOAN_PAYMENT':
      return 'bg-rose-900/50 text-rose-400';
    case 'RENT':
      return 'bg-violet-900/50 text-violet-400';
    default:
      return 'bg-slate-700/50 text-slate-400';
  }
}

function isOverdue(item: Item): boolean {
  if (item.isPaid) return false;
  const today = new Date().getDate();
  return today >= item.dayOfMonth;
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="item in sortedItems"
      :key="item.id"
      :class="[
        'bg-slate-900 rounded-xl border p-4 flex items-center justify-between transition-all',
        item.isPaid
          ? 'border-slate-800 opacity-50'
          : isOverdue(item)
            ? 'border-amber-700/50 bg-amber-950/20'
            : 'border-slate-800',
      ]"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Paid checkbox -->
        <input
          type="checkbox"
          :checked="item.isPaid"
          class="w-5 h-5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/50 cursor-pointer"
          :disabled="!canEdit"
          @change="$emit('toggle-paid', item.id)"
        />

        <!-- Type badge -->
        <span
          :class="[
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap',
            typeBadgeClass(item.type),
          ]"
        >
          {{ ITEM_TYPE_LABELS[item.type] }}
        </span>

        <!-- Label -->
        <span
          :class="[
            'font-medium truncate',
            item.isPaid ? 'line-through text-slate-500' : 'text-slate-200',
          ]"
        >
          {{ item.label }}
        </span>
      </div>

      <div class="flex items-center gap-4 ml-4 shrink-0">
        <!-- Amount -->
        <span
          :class="[
            'font-semibold tabular-nums',
            ITEM_TYPE_IS_INCOME[item.type] ? 'text-emerald-400' : 'text-rose-400',
            item.isPaid ? 'line-through opacity-50' : '',
          ]"
        >
          {{ ITEM_TYPE_IS_INCOME[item.type] ? '+' : '-' }}{{ formatAmount(item.amount) }}
        </span>

        <!-- Day badge -->
        <span class="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md whitespace-nowrap">
          Day {{ item.dayOfMonth }}
        </span>

        <!-- Edit/Delete buttons -->
        <div v-if="canEdit" class="flex items-center gap-1">
          <button
            class="p-1 text-slate-500 hover:text-violet-400 transition-colors"
            title="Edit item"
            @click="$emit('edit', item)"
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
          <button
            class="p-1 text-slate-500 hover:text-rose-400 transition-colors"
            title="Delete item"
            @click="$emit('delete', item.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <!-- Paid checkmark for non-editable -->
        <span v-if="item.isPaid && !canEdit" class="text-emerald-400 text-lg">&#10003;</span>
      </div>
    </div>
  </div>
</template>
