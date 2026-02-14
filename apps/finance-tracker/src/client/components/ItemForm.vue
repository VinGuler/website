<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Item, ItemType } from '@/types';
import { ITEM_TYPE_LABELS } from '@/types';

const props = defineProps<{
  item?: Item;
  workspaceId: string;
}>();

const emit = defineEmits<{
  submit: [data: { type: ItemType; label: string; amount: number; dayOfMonth: number }];
  cancel: [];
}>();

const label = ref('');
const amount = ref<number | string>('');
const dayOfMonth = ref(1);
const type = ref<ItemType>('OTHER');

const itemTypes = Object.entries(ITEM_TYPE_LABELS) as [ItemType, string][];

// Generate days 1-31 for the dropdown
const days = Array.from({ length: 31 }, (_, i) => i + 1);

onMounted(() => {
  if (props.item) {
    label.value = props.item.label;
    amount.value = props.item.amount;
    dayOfMonth.value = props.item.dayOfMonth;
    type.value = props.item.type;
  }
});

function handleSubmit() {
  const parsedAmount = typeof amount.value === 'string' ? parseFloat(amount.value) : amount.value;

  if (!label.value.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
    return;
  }

  emit('submit', {
    type: type.value,
    label: label.value.trim(),
    amount: parsedAmount,
    dayOfMonth: dayOfMonth.value,
  });
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
    <div
      class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-md mx-4"
    >
      <h3 class="text-lg font-semibold text-slate-100 mb-4">
        {{ item ? 'Edit Item' : 'Add Item' }}
      </h3>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Label -->
        <div>
          <label for="item-label" class="block text-sm font-medium text-slate-300 mb-1"
            >Label</label
          >
          <input
            id="item-label"
            v-model="label"
            type="text"
            required
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="e.g., Monthly salary, Rent payment"
          />
        </div>

        <!-- Type -->
        <div>
          <label for="item-type" class="block text-sm font-medium text-slate-300 mb-1">Type</label>
          <select
            id="item-type"
            v-model="type"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
          >
            <option v-for="[value, typeLabel] in itemTypes" :key="value" :value="value">
              {{ typeLabel }}
            </option>
          </select>
        </div>

        <!-- Amount -->
        <div>
          <label for="item-amount" class="block text-sm font-medium text-slate-300 mb-1"
            >Amount</label
          >
          <input
            id="item-amount"
            v-model="amount"
            type="number"
            required
            min="0.01"
            step="0.01"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
            placeholder="0.00"
          />
        </div>

        <!-- Day of Month -->
        <div>
          <label for="item-day" class="block text-sm font-medium text-slate-300 mb-1"
            >Day of Month</label
          >
          <select
            id="item-day"
            v-model="dayOfMonth"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
          >
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          >
            {{ item ? 'Save Changes' : 'Add Item' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
