import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';
import { i18n } from '@/i18n';
import type { WorkspaceData, Item, Permission, BalanceCards, CreateItemData } from '@/types';
import { ITEM_TYPE_IS_INCOME } from '@/types';
import { buildCycleLabel } from '@/utils';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<WorkspaceData | null>(null);
  const loading = ref(false);
  const updating = ref(false);
  const error = ref<string | null>(null);
  const rawCycleLabel = ref<string | null>(null);

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

  const cycleLabel = computed(() => {
    if (!rawCycleLabel.value) return '';
    return buildCycleLabel(rawCycleLabel.value, i18n.global.locale.value);
  });

  async function fetchWorkspace(workspaceId?: string) {
    loading.value = true;
    error.value = null;

    const url = workspaceId ? `/api/workspace?workspaceId=${workspaceId}` : '/api/workspace';
    const result = await api<WorkspaceData>(url);

    if (result.success && result.data) {
      workspace.value = result.data;

      rawCycleLabel.value = result.data.cycleLabel;
    } else {
      error.value = result.error || 'Failed to load workspace';
    }

    loading.value = false;
  }

  async function updateBalance(balance: number) {
    if (!workspace.value) return;

    error.value = null;
    updating.value = true;
    const result = await api('/api/workspace/balance', {
      method: 'PUT',
      body: JSON.stringify({ workspaceId: workspace.value.workspace.id, balance }),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value.workspace.id);
    } else {
      error.value = result.error || 'Failed to update balance';
    }
    updating.value = false;
  }

  async function addItem(data: CreateItemData) {
    error.value = null;
    updating.value = true;
    const result = await api('/api/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to add item';
    }
    updating.value = false;
  }

  async function updateItem(
    itemId: string,
    data: Partial<Pick<Item, 'label' | 'amount' | 'dayOfMonth' | 'type'>>
  ) {
    error.value = null;
    updating.value = true;
    const result = await api(`/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to update item';
    }
    updating.value = false;
  }

  async function deleteItem(itemId: string) {
    error.value = null;
    updating.value = true;
    const result = await api(`/api/items/${itemId}`, {
      method: 'DELETE',
    });

    if (result.success) {
      await fetchWorkspace(workspace.value?.workspace.id);
    } else {
      error.value = result.error || 'Failed to delete item';
    }
    updating.value = false;
  }

  async function togglePaid(itemId: string) {
    error.value = null;
    updating.value = true;

    if (workspace.value) {
      const itemIndex = workspace.value.items.findIndex((i) => String(i.id) === String(itemId));
      if (itemIndex === -1 || !workspace.value.items[itemIndex]) {
        error.value = 'Item not found';
        updating.value = false;
        return;
      }

      workspace.value.items[itemIndex].isPaid = !workspace.value.items[itemIndex].isPaid;
    }

    const result = await api<Item>(`/api/items/${itemId}/toggle-paid`, {
      method: 'PATCH',
    });

    if (result.success && result.data && workspace.value) {
      const idx = workspace.value.items.findIndex((i) => String(i.id) === String(itemId));
      if (idx !== -1) {
        workspace.value.items.splice(idx, 1, result.data);
      }
      const wsResult = await api<WorkspaceData>(
        `/api/workspace?workspaceId=${workspace.value.workspace.id}`
      );
      if (wsResult.success && wsResult.data) {
        workspace.value.balanceCards = wsResult.data.balanceCards;
      }
    } else {
      error.value = result.error || 'Failed to toggle paid status';
    }
    updating.value = false;
  }

  async function resetWorkspace() {
    if (!workspace.value) return;

    error.value = null;
    updating.value = true;
    const result = await api('/api/workspace/reset', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: workspace.value.workspace.id }),
    });

    if (result.success) {
      await fetchWorkspace(workspace.value.workspace.id);
    } else {
      error.value = result.error || 'Failed to reset workspace';
    }
    updating.value = false;
  }

  return {
    workspace,
    loading,
    updating,
    error,
    items,
    incomeItems,
    paymentItems,
    isEmpty,
    allPaid,
    permission,
    canEdit,
    balanceCards,
    cycleLabel,
    fetchWorkspace,
    updateBalance,
    addItem,
    updateItem,
    deleteItem,
    togglePaid,
    resetWorkspace,
  };
});
