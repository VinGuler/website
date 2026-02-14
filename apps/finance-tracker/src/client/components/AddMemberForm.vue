<script setup lang="ts">
import { ref } from 'vue';
import { useSharingStore } from '@/stores/sharing';
import type { Permission } from '@/types';

const props = defineProps<{
  workspaceId: string;
}>();

defineEmits<{
  'member-added': [];
}>();

const sharing = useSharingStore();

const searchUsername = ref('');
const selectedPermission = ref<Permission>('VIEWER');

function handleSearchInputChange() {
  sharing.clearSearch();
}

async function handleSearch() {
  const username = searchUsername.value.trim();
  if (!username) return;
  await sharing.searchUser(username);
}

async function handleAdd() {
  if (!sharing.searchResult) return;
  await sharing.addMember(props.workspaceId, sharing.searchResult.id, selectedPermission.value);
  searchUsername.value = '';
}
</script>

<template>
  <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
    <h4 class="text-sm font-medium text-slate-300 mb-3">Add Member</h4>

    <!-- Search -->
    <div class="flex gap-2 mb-3">
      <input
        v-model="searchUsername"
        type="text"
        placeholder="Search by username"
        class="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
        @input="handleSearchInputChange"
        @keyup.enter="handleSearch"
      />
      <button
        class="px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
        :disabled="sharing.loading"
        @click="handleSearch"
      >
        Search
      </button>
    </div>

    <!-- Error -->
    <p v-if="sharing.error" class="text-sm text-rose-400 mb-3">
      {{ sharing.error }}
    </p>

    <!-- Search result -->
    <div
      v-if="sharing.searchResult"
      class="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-3"
    >
      <div>
        <p class="text-sm font-medium text-slate-200">{{ sharing.searchResult.displayName }}</p>
        <p class="text-xs text-slate-500">@{{ sharing.searchResult.username }}</p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedPermission"
          class="px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
        >
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button
          class="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          :disabled="sharing.loading"
          @click="handleAdd"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>
