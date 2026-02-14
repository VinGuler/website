import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/composables/useApi';
import type { Member, SharedWorkspace, Permission, User } from '@/types';

export const useSharingStore = defineStore('sharing', () => {
  const members = ref<Member[]>([]);
  const sharedWorkspaces = ref<SharedWorkspace[]>([]);
  const searchResult = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  function clearSearch() {
    searchResult.value = null;
    error.value = null;
  }

  async function fetchMembers(workspaceId: number | string) {
    loading.value = true;
    error.value = null;

    const result = await api<Member[]>(`/api/workspace/${workspaceId}/members`);

    if (result.success && result.data) {
      members.value = result.data;
    } else {
      error.value = result.error || 'Failed to load members';
    }

    loading.value = false;
  }

  async function fetchSharedWorkspaces() {
    loading.value = true;
    error.value = null;

    const result = await api<SharedWorkspace[]>('/api/workspaces/shared');

    if (result.success && result.data) {
      sharedWorkspaces.value = result.data;
    } else {
      error.value = result.error || 'Failed to load shared workspaces';
    }

    loading.value = false;
  }

  async function searchUser(username: string) {
    loading.value = true;
    error.value = null;
    searchResult.value = null;

    const result = await api<User>(`/api/users/search?username=${encodeURIComponent(username)}`);

    if (result.success && result.data) {
      searchResult.value = result.data;
    } else {
      error.value = result.error || 'User not found';
    }

    loading.value = false;
  }

  async function addMember(
    workspaceId: number | string,
    userId: number | string,
    permission: Permission
  ) {
    loading.value = true;
    error.value = null;

    const result = await api(`/api/workspace/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId), permission }),
    });

    if (result.success) {
      searchResult.value = null;
      await fetchMembers(workspaceId);
    } else {
      error.value = result.error || 'Failed to add member';
    }

    loading.value = false;
  }

  async function removeMember(workspaceId: number | string, userId: number | string) {
    loading.value = true;
    error.value = null;

    const result = await api(`/api/workspace/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      await fetchMembers(workspaceId);
    } else {
      error.value = result.error || 'Failed to remove member';
    }

    loading.value = false;
  }

  return {
    members,
    sharedWorkspaces,
    searchResult,
    loading,
    error,
    fetchMembers,
    fetchSharedWorkspaces,
    searchUser,
    clearSearch,
    addMember,
    removeMember,
  };
});
