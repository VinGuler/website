<script setup lang="ts">
import { onMounted } from 'vue';
import { useSharingStore } from '@/stores/sharing';
import { RouterLink } from 'vue-router';
import type { Permission } from '@/types';

const sharing = useSharingStore();

function permissionBadgeClass(permission: Permission): string {
  switch (permission) {
    case 'OWNER':
      return 'bg-violet-900/50 text-violet-400';
    case 'MEMBER':
      return 'bg-sky-900/50 text-sky-400';
    case 'VIEWER':
      return 'bg-slate-700/50 text-slate-400';
  }
}

async function leaveWorkspace(workspaceId: string) {
  // Remove self from the shared workspace
  const result = await fetch(`/api/sharing/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId }),
  });
  if (result.ok) {
    await sharing.fetchSharedWorkspaces();
  }
}

onMounted(() => {
  sharing.fetchSharedWorkspaces();
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-slate-100">Shared Workspaces</h2>
      <RouterLink to="/" class="text-sm text-violet-400 hover:text-violet-300 font-medium">
        Back to My Workspace
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="sharing.loading" class="text-center py-12">
      <div
        class="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-3"
      ></div>
      <p class="text-slate-400">Loading shared workspaces...</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="sharing.sharedWorkspaces.length === 0"
      class="text-center py-16 bg-slate-900 rounded-xl border border-slate-800"
    >
      <div class="text-4xl mb-3 text-slate-600">&#128101;</div>
      <h3 class="text-lg font-medium text-slate-200 mb-1">No shared workspaces</h3>
      <p class="text-sm text-slate-400">
        When someone shares their workspace with you, it will appear here.
      </p>
    </div>

    <!-- Shared workspaces list -->
    <div v-else class="space-y-3">
      <div
        v-for="ws in sharing.sharedWorkspaces"
        :key="ws.workspaceId"
        class="bg-slate-900 rounded-xl border border-slate-800 p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div>
            <p class="font-medium text-slate-200">{{ ws.ownerDisplayName }}'s Workspace</p>
            <span
              :class="[
                'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                permissionBadgeClass(ws.permission),
              ]"
            >
              {{ ws.permission }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink
            :to="{ path: '/', query: { workspaceId: ws.workspaceId } }"
            class="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
          >
            View
          </RouterLink>
          <button
            class="px-3 py-1.5 text-sm text-rose-400 border border-rose-800/50 rounded-lg hover:bg-rose-950/30 transition-colors"
            @click="leaveWorkspace(ws.workspaceId)"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
