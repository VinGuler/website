// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import App from '../App.vue';
import en from '../locales/en.json';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div class="home">Home</div>' } },
      { path: '/login', component: { template: '<div class="login">Login</div>' } },
    ],
  });
}

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: { en },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  mockFetch.mockReset();
});

describe('App', () => {
  it('mounts and hides header when not authenticated', () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    const wrapper = mount(App, {
      global: {
        plugins: [createTestRouter(), createTestI18n()],
      },
    });

    expect(wrapper.find('.app').exists()).toBe(true);
    // Header should be hidden when not authenticated
    expect(wrapper.find('.app-header').exists()).toBe(false);
  });
});
