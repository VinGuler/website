// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  setActivePinia(createPinia());
  mockFetch.mockReset();
});

describe('App', () => {
  it('renders the todo list heading', () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const wrapper = mount(App);
    expect(wrapper.find('h1').text()).toBe('Client-Server');
  });

  it('displays todos fetched from the API', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            { id: 1, text: 'Learn TypeScript', completed: true },
            { id: 2, text: 'Build an app', completed: false },
          ],
        }),
    });

    const wrapper = mount(App);
    await vi.waitFor(() => {
      expect(wrapper.findAll('.todo-list li')).toHaveLength(2);
    });

    const items = wrapper.findAll('.todo-list li');
    expect(items[0].text()).toContain('Learn TypeScript');
    expect(items[1].text()).toContain('Build an app');
  });

  it('adds a new todo via the form', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { id: 1, text: 'New task', completed: false },
          }),
      });

    const wrapper = mount(App);
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const input = wrapper.find('input[type="text"]');
    await input.setValue('New task');
    await wrapper.find('form').trigger('submit');

    await vi.waitFor(() => {
      expect(wrapper.findAll('.todo-list li')).toHaveLength(1);
    });

    expect(wrapper.find('.todo-list li').text()).toContain('New task');
  });
});
