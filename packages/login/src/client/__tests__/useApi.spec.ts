import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiComposable } from '../composables/useApi.js';

describe('createApiComposable', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear document cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('injects CSRF token from cookie into x-csrf-token header', async () => {
    document.cookie = 'my_csrf=csrf-token-value; path=/';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });
    globalThis.fetch = mockFetch;

    const api = createApiComposable('my_csrf');
    await api('/api/test', { method: 'POST', body: '{}' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['x-csrf-token']).toBe('csrf-token-value');
  });

  it('returns { success: true, data } on 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1, username: 'alice' } }),
    });

    const api = createApiComposable('csrf');
    const result = await api('/api/test');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, username: 'alice' });
  });

  it('returns { success: false, error } on non-200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const api = createApiComposable('csrf');
    const result = await api('/api/test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not found');
  });

  it('returns { success: false, error: "Network error" } on fetch throw', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const api = createApiComposable('csrf');
    const result = await api('/api/test');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('sets Content-Type: application/json', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });
    globalThis.fetch = mockFetch;

    const api = createApiComposable('csrf');
    await api('/api/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});
