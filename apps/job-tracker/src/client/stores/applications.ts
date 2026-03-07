import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/composables/useApi';

export interface Stage {
  id: number;
  applicationId: number;
  label: string;
  order: number;
  isCompleted: boolean;
  notes: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  userId: number;
  companyName: string;
  role: string;
  status: 'APPLIED' | 'IN_PROGRESS' | 'OFFER' | 'REJECTED' | 'GHOSTED' | 'ARCHIVED';
  salaryRange: string | null;
  jobLink: string | null;
  companyUrl: string | null;
  description: string | null;
  position: number;
  stages: Stage[];
  nextStep: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useApplicationStore = defineStore('applications', () => {
  const applications = ref<Application[]>([]);
  const searchQuery = ref('');
  const activeApplicationId = ref<number | null>(null);
  const loading = ref(false);

  const filteredApplications = computed(() => {
    if (!searchQuery.value) return applications.value;
    const q = searchQuery.value.toLowerCase();
    return applications.value.filter(
      (a) => a.companyName.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
    );
  });

  const applicationsByStatus = computed(() => {
    const grouped = {
      APPLIED: [] as Application[],
      IN_PROGRESS: [] as Application[],
      OFFER: [] as Application[],
      ARCHIVED: [] as Application[],
    };

    for (const app of filteredApplications.value) {
      if (app.status === 'REJECTED' || app.status === 'GHOSTED' || app.status === 'ARCHIVED') {
        grouped.ARCHIVED.push(app);
      } else {
        grouped[app.status].push(app);
      }
    }

    return grouped;
  });

  const activeApplication = computed(
    () => applications.value.find((a) => a.id === activeApplicationId.value) ?? null
  );

  async function fetchApplications() {
    loading.value = true;
    const result = await api<Application[]>(
      searchQuery.value
        ? `/api/applications?search=${encodeURIComponent(searchQuery.value)}`
        : '/api/applications'
    );
    if (result.success) {
      applications.value = result.data;
    }
    loading.value = false;
  }

  async function createApplication(data: { companyName: string; role: string }) {
    const result = await api<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success) {
      applications.value.push(result.data);
    }
    return result;
  }

  async function updateApplication(
    id: number,
    data: Partial<
      Omit<Application, 'id' | 'userId' | 'stages' | 'nextStep' | 'createdAt' | 'updatedAt'>
    >
  ) {
    const result = await api<Application>(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.success) {
      const idx = applications.value.findIndex((a) => a.id === id);
      if (idx !== -1) applications.value[idx] = result.data;
    }
    return result;
  }

  async function deleteApplication(id: number) {
    const result = await api(`/api/applications/${id}`, { method: 'DELETE' });
    if (result.success) {
      applications.value = applications.value.filter((a) => a.id !== id);
      if (activeApplicationId.value === id) activeApplicationId.value = null;
    }
    return result;
  }

  // Stage actions
  async function addStage(applicationId: number, label: string, scheduledAt?: string) {
    const result = await api<Stage>(`/api/applications/${applicationId}/stages`, {
      method: 'POST',
      body: JSON.stringify({ label, scheduledAt }),
    });
    if (result.success) {
      const app = applications.value.find((a) => a.id === applicationId);
      if (app) {
        app.stages.push(result.data);
        recalcNextStep(app);
      }
    }
    return result;
  }

  async function updateStage(
    stageId: number,
    data: Partial<Pick<Stage, 'label' | 'notes' | 'scheduledAt' | 'isCompleted'>>
  ) {
    const result = await api<Stage>(`/api/stages/${stageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.success) {
      updateStageInApp(result.data);
    }
    return result;
  }

  async function toggleStage(stageId: number) {
    const result = await api<Stage>(`/api/stages/${stageId}/toggle`, { method: 'PUT' });
    if (result.success) {
      updateStageInApp(result.data);
    }
    return result;
  }

  async function reorderStages(applicationId: number, stageIds: number[]) {
    const result = await api<Stage[]>('/api/stages/reorder', {
      method: 'PUT',
      body: JSON.stringify({ applicationId, stageIds }),
    });
    if (result.success) {
      const app = applications.value.find((a) => a.id === applicationId);
      if (app) {
        app.stages = result.data;
        recalcNextStep(app);
      }
    }
    return result;
  }

  async function deleteStage(stageId: number) {
    const result = await api(`/api/stages/${stageId}`, { method: 'DELETE' });
    if (result.success) {
      for (const app of applications.value) {
        const idx = app.stages.findIndex((s) => s.id === stageId);
        if (idx !== -1) {
          app.stages.splice(idx, 1);
          recalcNextStep(app);
          break;
        }
      }
    }
    return result;
  }

  function updateStageInApp(stage: Stage) {
    const app = applications.value.find((a) => a.id === stage.applicationId);
    if (app) {
      const idx = app.stages.findIndex((s) => s.id === stage.id);
      if (idx !== -1) app.stages[idx] = stage;
      recalcNextStep(app);
    }
  }

  function recalcNextStep(app: Application) {
    const sorted = [...app.stages].sort((a, b) => a.order - b.order);
    const next = sorted.find((s) => !s.isCompleted);
    app.nextStep = next ? next.label : sorted.length > 0 ? 'Pending Decision' : null;
  }

  return {
    applications,
    searchQuery,
    activeApplicationId,
    loading,
    filteredApplications,
    applicationsByStatus,
    activeApplication,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    addStage,
    updateStage,
    toggleStage,
    reorderStages,
    deleteStage,
  };
});
