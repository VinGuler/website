import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import type { WorkspaceData, Item, Permission, BalanceCards, CreateItemData } from '@/types';
import { ITEM_TYPE_IS_INCOME } from '@/types';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<WorkspaceData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const items = computed<Item[]>(() => workspace.value?.items ?? []);

  const incomeItems = computed<Item[]>(() =>
    items.value.filter((item) => ITEM_TYPE_IS_INCOME[item.type])
  );

  const paymentItems = computed<Item[]>(() =>
    items.value.filter((item) => !ITEM_TYPE_IS_INCOME[item.type])
  );

  const isEmpty = computed(() => items.value.length === 0);

  const allPaid = computed(() => {
    if (isEmpty.value) return false;
    return items.value.every((item) => item.isPaid);
  });

  const permission = computed<Permission>(() => workspace.value?.permission ?? 'VIEWER');

  const canEdit = computed(() => permission.value === 'OWNER' || permission.value === 'MEMBER');

  const balanceCards = computed<BalanceCards | null>(() => workspace.value?.balanceCards ?? null);

  async function fetchWorkspace(workspaceId?: string) {
    loading.value = true;
    error.value = null;

    const url = workspaceId ? `/api/workspace?workspaceId=${workspaceId}` : '/api/workspace';
    const result = await api<WorkspaceData>(url);

    if (result.success && result.data) {
      workspace.value = result.data;
    } else {
      error.value = result.error || 'Failed to load workspace';
    }

    loading.value = false;
  }

  async function updateBalance(balance: number) {
    if (!workspace.value) return;

    error.value = null;
    const result = await api('/api/workspace/balance', {
      method: 'PUT',
      body: JSON.stringify({ workspaceId: workspace.value.workspace.id, balance }),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value.workspace.id);
    } else {
      error.value = result.error || 'Failed to update balance';
    }
  }

  async function addItem(data: CreateItemData) {
    error.value = null;
    const result = await api('/api/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to add item';
    }
  }

  async function updateItem(
    itemId: string,
    data: Partial<Pick<Item, 'label' | 'amount' | 'dayOfMonth' | 'type'>>
  ) {
    error.value = null;
    const result = await api(`/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to update item';
    }
  }

  async function deleteItem(itemId: string) {
    error.value = null;
    const result = await api(`/api/items/${itemId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to delete item';
    }
  }

  async function togglePaid(itemId: string) {
    error.value = null;
    const result = await api(`/api/items/${itemId}/toggle-paid`, {
      method: 'PATCH',
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to toggle paid status';
    }
  }

  async function resetWorkspace() {
    if (!workspace.value) return;

    error.value = null;
    const result = await api('/api/workspace/reset', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: workspace.value.workspace.id }),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value.workspace.id);
    } else {
      error.value = result.error || 'Failed to reset workspace';
    }
  }

  return {
    workspace,
    loading,
    error,
    items,
    incomeItems,
    paymentItems,
    isEmpty,
    allPaid,
    permission,
    canEdit,
    balanceCards,
    fetchWorkspace,
    updateBalance,
    addItem,
    updateItem,
    deleteItem,
    togglePaid,
    resetWorkspace,
  };
});
