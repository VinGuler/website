/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Todo Client - Basic Tests', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
    // Mock alert
    global.alert = vi.fn();
  });

  it('should have document available in jsdom environment', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
  });

  it('should be able to create DOM elements', () => {
    const div = document.createElement('div');
    div.id = 'test';
    div.textContent = 'Hello Test';

    expect(div.id).toBe('test');
    expect(div.textContent).toBe('Hello Test');
  });

  it('should be able to mock fetch for GET request', async () => {
    const mockData = { success: true, data: [{ id: 1, text: 'Test', completed: false }] };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData,
    });

    const response = await fetch('/api/todos');
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].text).toBe('Test');
  });

  it('should be able to mock fetch for POST request', async () => {
    const mockTodo = { id: 2, text: 'New Todo', completed: false };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockTodo }),
    });

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'New Todo' }),
    });

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.data.text).toBe('New Todo');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should be able to test DOM manipulation', () => {
    document.body.innerHTML = '<div id="todo-list"></div>';

    const todoList = document.getElementById('todo-list');
    expect(todoList).not.toBeNull();

    todoList!.innerHTML = '<div class="todo-item">Test Todo</div>';

    expect(todoList!.innerHTML).toContain('Test Todo');
    expect(todoList!.innerHTML).toContain('todo-item');
  });

  it('should be able to test form submission', () => {
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" id="test-input" value="test value" />
      </form>
    `;

    const form = document.getElementById('test-form') as HTMLFormElement;
    const input = document.getElementById('test-input') as HTMLInputElement;

    expect(form).not.toBeNull();
    expect(input).not.toBeNull();
    expect(input.value).toBe('test value');

    const submitHandler = vi.fn((e) => e.preventDefault());
    form.addEventListener('submit', submitHandler);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(submitHandler).toHaveBeenCalled();
  });
});
