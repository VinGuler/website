// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '../App.vue';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Workspace</div>' } },
      {
        path: '/login',
        component: { template: '<div class="login-page">Login Page</div>' },
      },
      { path: '/register', component: { template: '<div>Register</div>' } },
      { path: '/shared', component: { template: '<div>Shared</div>' } },
    ],
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  mockFetch.mockReset();
});

describe('App', () => {
  it('renders the app container', async () => {
    // Mock /api/auth/me to return 401 (not authenticated)
    mockFetch.mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({ success: false, error: 'Not authenticated' }),
    });

    const router = createTestRouter();
    router.push('/login');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('.min-h-screen').exists()).toBe(true);
  });

  it('does not show header when user is not authenticated', async () => {
    mockFetch.mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({ success: false, error: 'Not authenticated' }),
    });

    const router = createTestRouter();
    router.push('/login');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });

    // Header should not be present since user is not authenticated
    expect(wrapper.findComponent({ name: 'AppHeader' }).exists()).toBe(false);
  });
});
