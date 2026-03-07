<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps<{ notes: string }>();
const emit = defineEmits<{ save: [notes: string] }>();

const editing = ref(false);
const draft = ref(props.notes);

watch(
  () => props.notes,
  (v) => (draft.value = v)
);

const rendered = computed(() => {
  if (!draft.value) return '';
  return marked.parse(draft.value, { async: false }) as string;
});

function save() {
  emit('save', draft.value);
  editing.value = false;
}
</script>

<template>
  <div>
    <div v-if="editing" class="space-y-2">
      <textarea
        v-model="draft"
        rows="4"
        class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
        placeholder="Markdown supported..."
      />
      <div class="flex gap-2">
        <button
          class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors cursor-pointer"
          @click="save"
        >
          Save
        </button>
        <button
          class="px-3 py-1 text-xs border border-slate-600 text-slate-400 rounded hover:bg-slate-700 transition-colors cursor-pointer"
          @click="editing = false"
        >
          Cancel
        </button>
      </div>
    </div>
    <div v-else>
      <div
        v-if="notes"
        class="prose prose-invert prose-sm max-w-none text-slate-300 cursor-pointer rounded p-2 hover:bg-slate-700/50"
        @click="editing = true"
        v-html="rendered"
      />
      <button
        v-else
        class="text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
        @click="editing = true"
      >
        + Add notes
      </button>
    </div>
  </div>
</template>
