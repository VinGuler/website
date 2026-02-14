<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useWorkspaceStore } from '@/stores/workspace';
import { useSharingStore } from '@/stores/sharing';
import { useAuthStore } from '@/stores/auth';
import BalanceCards from '@/components/BalanceCards.vue';
import ItemList from '@/components/ItemList.vue';
import ItemForm from '@/components/ItemForm.vue';
import EmptyState from '@/components/EmptyState.vue';
import MemberList from '@/components/MemberList.vue';
import AddMemberForm from '@/components/AddMemberForm.vue';
import type { Item } from '@/types';

const route = useRoute();
const store = useWorkspaceStore();
const sharing = useSharingStore();
const auth = useAuthStore();

const showItemForm = ref(false);
const editingItem = ref<Item | undefined>(undefined);
const showResetConfirm = ref(false);
const editingBalance = ref(false);
const balanceInput = ref('');

const workspaceId = computed(() => (route.query.workspaceId as string) || undefined);

const isSharedView = computed(() => !!workspaceId.value);

function openAddItem() {
  editingItem.value = undefined;
  showItemForm.value = true;
}

function openEditItem(item: Item) {
  editingItem.value = item;
  showItemForm.value = true;
}

function closeItemForm() {
  showItemForm.value = false;
  editingItem.value = undefined;
}

async function handleItemSubmit(data: {
  type: Item['type'];
  label: string;
  amount: number;
  dayOfMonth: number;
}) {
  if (editingItem.value) {
    await store.updateItem(editingItem.value.id, data);
  } else {
    await store.addItem({
      workspaceId: store.workspace!.workspace.id,
      ...data,
    });
  }
  closeItemForm();
}

async function handleDeleteItem(itemId: string) {
  await store.deleteItem(itemId);
}

async function handleTogglePaid(itemId: string) {
  await store.togglePaid(itemId);
}

function startBalanceEdit() {
  balanceInput.value = String(store.workspace?.workspace.balance ?? 0);
  editingBalance.value = true;
}

async function saveBalance() {
  const value = parseFloat(balanceInput.value);
  if (!isNaN(value)) {
    await store.updateBalance(value);
  }
  editingBalance.value = false;
}

function cancelBalanceEdit() {
  editingBalance.value = false;
}

async function handleReset() {
  await store.resetWorkspace();
  showResetConfirm.value = false;
}

function loadWorkspace() {
  store.fetchWorkspace(workspaceId.value);
  if (store.workspace?.workspace.id) {
    sharing.fetchMembers(store.workspace.workspace.id);
  }
}

watch(
  () => route.query.workspaceId,
  () => {
    loadWorkspace();
  }
);

watch(
  () => store.workspace?.workspace.id,
  (id) => {
    if (id) {
      sharing.fetchMembers(id);
    }
  }
);

onMounted(() => {
  loadWorkspace();
});
</script>

<template>
  <!-- Loading state -->
  <div v-if="store.loading && !store.workspace" class="flex justify-center items-center py-20">
    <div class="text-center">
      <div
        class="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-3"
      ></div>
      <p class="text-slate-400">Loading workspace...</p>
    </div>
  </div>

  <!-- Error state -->
  <div v-else-if="store.error && !store.workspace" class="text-center py-20">
    <p class="text-rose-400 mb-4">{{ store.error }}</p>
    <button
      class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
      @click="loadWorkspace"
    >
      Retry
    </button>
  </div>

  <!-- Workspace loaded -->
  <div v-else-if="store.workspace">
    <!-- Shared workspace banner -->
    <div
      v-if="isSharedView"
      class="mb-4 px-4 py-2 bg-violet-950/30 border border-violet-800/30 rounded-lg text-sm text-violet-300"
    >
      You are viewing a shared workspace ({{ store.permission }})
    </div>

    <!-- Cycle label -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-slate-100">{{ store.workspace.cycleLabel }}</h2>
    </div>

    <!-- All paid / between cycles state -->
    <div v-if="store.allPaid" class="mb-6">
      <div class="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-6 text-center">
        <div class="text-3xl mb-2">&#10003;</div>
        <h3 class="text-lg font-semibold text-emerald-300 mb-1">Cycle Complete</h3>
        <p class="text-emerald-400/70 text-sm">
          All items have been marked as paid. You can reset the workspace to start a new cycle.
        </p>
        <button
          v-if="store.canEdit"
          class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          @click="showResetConfirm = true"
        >
          Reset for New Cycle
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState v-else-if="store.isEmpty" @add-item="openAddItem" />

    <!-- Active cycle -->
    <div v-else>
      <!-- Balance cards -->
      <BalanceCards
        v-if="store.balanceCards"
        :current-balance="store.balanceCards.currentBalance"
        :expected-balance="store.balanceCards.expectedBalance"
        :deficit-excess="store.balanceCards.deficitExcess"
        :can-edit="store.canEdit"
        @update-balance="startBalanceEdit"
      />

      <!-- Balance edit modal -->
      <div
        v-if="editingBalance"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div
          class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4"
        >
          <h3 class="text-lg font-semibold text-slate-100 mb-4">Update Current Balance</h3>
          <input
            v-model="balanceInput"
            type="number"
            step="0.01"
            class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors mb-4"
            @keyup.enter="saveBalance"
          />
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              @click="cancelBalanceEdit"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
              @click="saveBalance"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <!-- Add item CTA -->
      <div v-if="store.canEdit" class="my-4">
        <button
          class="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-violet-500/50 hover:text-violet-400 transition-colors font-medium"
          @click="openAddItem"
        >
          + Add Item
        </button>
      </div>

      <!-- Error display -->
      <p v-if="store.error" class="text-sm text-rose-400 mb-4">{{ store.error }}</p>

      <!-- Item list -->
      <ItemList
        :items="store.items"
        :can-edit="store.canEdit"
        @toggle-paid="handleTogglePaid"
        @edit="openEditItem"
        @delete="handleDeleteItem"
      />
    </div>

    <!-- Sharing section (only for owners) -->
    <div v-if="store.permission === 'OWNER'" class="mt-8 border-t border-slate-800 pt-6">
      <h3 class="text-lg font-semibold text-slate-100 mb-4">Sharing</h3>

      <AddMemberForm
        :workspace-id="store.workspace.workspace.id"
        @member-added="sharing.fetchMembers(store.workspace!.workspace.id)"
      />

      <MemberList
        :members="sharing.members"
        :current-user-id="auth.user?.id ?? ''"
        :current-permission="store.permission"
        @remove-member="
          (userId: string) => sharing.removeMember(store.workspace!.workspace.id, userId)
        "
      />
    </div>

    <!-- Reset confirmation modal -->
    <div
      v-if="showResetConfirm"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        class="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4"
      >
        <h3 class="text-lg font-semibold text-slate-100 mb-2">Reset Workspace?</h3>
        <p class="text-sm text-slate-400 mb-4">
          This will mark all items as unpaid and start a new cycle. This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            @click="showResetConfirm = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors"
            @click="handleReset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Item form modal -->
    <ItemForm
      v-if="showItemForm"
      :item="editingItem"
      :workspace-id="store.workspace.workspace.id"
      @submit="handleItemSubmit"
      @cancel="closeItemForm"
    />
  </div>
</template>
