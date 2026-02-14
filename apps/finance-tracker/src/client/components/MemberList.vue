<script setup lang="ts">
import type { Member, Permission } from '@/types';

defineProps<{
  members: Member[];
  currentUserId: string;
  currentPermission: Permission;
}>();

defineEmits<{
  'remove-member': [userId: string];
}>();

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

function canRemove(member: Member, currentUserId: string, currentPermission: Permission): boolean {
  // Cannot remove yourself
  if (member.userId === currentUserId) return false;
  // Only owners can remove members
  if (currentPermission !== 'OWNER') return false;
  // Cannot remove other owners
  if (member.permission === 'OWNER') return false;
  return true;
}
</script>

<template>
  <div v-if="members.length > 0" class="mt-4 space-y-2">
    <div
      v-for="member in members"
      :key="member.userId"
      class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-violet-900/50 text-violet-400 rounded-full flex items-center justify-center text-sm font-medium"
        >
          {{ member.displayName.charAt(0).toUpperCase() }}
        </div>
        <div>
          <p class="text-sm font-medium text-slate-200">{{ member.displayName }}</p>
          <p class="text-xs text-slate-500">@{{ member.username }}</p>
        </div>
        <span
          :class="[
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            permissionBadgeClass(member.permission),
          ]"
        >
          {{ member.permission }}
        </span>
      </div>
      <button
        v-if="canRemove(member, currentUserId, currentPermission)"
        class="text-sm text-rose-400 hover:text-rose-300 transition-colors"
        @click="$emit('remove-member', member.userId)"
      >
        Remove
      </button>
    </div>
  </div>
  <p v-else class="mt-4 text-sm text-slate-500">
    No members yet. Add someone to share your workspace.
  </p>
</template>
