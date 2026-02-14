<script setup lang="ts">
defineEmits<{
  'add-item': [];
}>();
</script>

<template>
  <div class="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
    <div class="mb-4">
      <svg
        class="w-16 h-16 mx-auto text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 class="text-lg font-medium text-slate-200 mb-2">No items yet</h3>
    <p class="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
      Start by adding your salary, bills, and recurring payments to track your monthly finances.
    </p>
    <button
      class="px-6 py-2.5 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
      @click="$emit('add-item')"
    >
      Add Your First Item
    </button>
  </div>
</template>
