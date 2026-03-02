import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createAuthStore } from '../stores/auth.js';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => ({ query: {} }),
}));

describe('createAuthStore', () => {
  const originalFetch = globalThis.fetch;
  let useAuthStore: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useAuthStore = createAuthStore({ csrfCookieName: 'test_csrf' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchResponse(ok: boolean, body: Record<string, unknown>) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    });
  }

  describe('checkSession', () => {
    it('sets user on success', async () => {
      mockFetchResponse(true, { data: { id: '1', username: 'alice', displayName: 'Alice' } });
      const store = useAuthStore();

      await store.checkSession();

      expect(store.user).toEqual({ id: '1', username: 'alice', displayName: 'Alice' });
      expect(store.isChecked).toBe(true);
      expect(store.isAuthenticated).toBe(true);
    });

    it('sets user to null on failure', async () => {
      mockFetchResponse(false, { error: 'Not authenticated' });
      const store = useAuthStore();

      await store.checkSession();

      expect(store.user).toBeNull();
      expect(store.isChecked).toBe(true);
      expect(store.isAuthenticated).toBe(false);
    });

    it('skips if already checked', async () => {
      mockFetchResponse(true, { data: { id: '1', username: 'alice', displayName: 'Alice' } });
      const store = useAuthStore();

      await store.checkSession();
      const callCount = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      await store.checkSession();
      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });
  });

  describe('login', () => {
    it('sets user and redirects on success', async () => {
      mockFetchResponse(true, { data: { id: '1', username: 'alice', displayName: 'Alice' } });
      const store = useAuthStore();

      await store.login('alice', 'password');

      expect(store.user).toEqual({ id: '1', username: 'alice', displayName: 'Alice' });
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('sets error on failure', async () => {
      mockFetchResponse(false, { error: 'Invalid credentials' });
      const store = useAuthStore();

      await store.login('alice', 'wrong');

      expect(store.user).toBeNull();
      expect(store.error).toBe('Invalid credentials');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('sets user and redirects on success', async () => {
      mockFetchResponse(true, { data: { id: '1', username: 'alice', displayName: 'Alice' } });
      const store = useAuthStore();

      await store.register('alice', 'Alice', 'StrongPass1', 'alice@example.com');

      expect(store.user).toEqual({ id: '1', username: 'alice', displayName: 'Alice' });
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('sets error on failure', async () => {
      mockFetchResponse(false, { error: 'Username already taken' });
      const store = useAuthStore();

      await store.register('alice', 'Alice', 'StrongPass1', 'alice@example.com');

      expect(store.user).toBeNull();
      expect(store.error).toBe('Username already taken');
    });
  });

  describe('logout', () => {
    it('clears user and redirects', async () => {
      mockFetchResponse(true, { data: { id: '1', username: 'alice', displayName: 'Alice' } });
      const store = useAuthStore();
      await store.login('alice', 'password');

      mockFetchResponse(true, {});
      await store.logout();

      expect(store.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('forgotPassword', () => {
    it('returns true on success', async () => {
      mockFetchResponse(true, {});
      const store = useAuthStore();

      const result = await store.forgotPassword('alice');

      expect(result).toBe(true);
      expect(store.error).toBeNull();
    });

    it('returns false and sets error on failure', async () => {
      mockFetchResponse(false, { error: 'Request failed' });
      const store = useAuthStore();

      const result = await store.forgotPassword('alice');

      expect(result).toBe(false);
      expect(store.error).toBe('Request failed');
    });
  });

  describe('resetPasswordWithToken', () => {
    it('returns true on success', async () => {
      mockFetchResponse(true, {});
      const store = useAuthStore();

      const result = await store.resetPasswordWithToken('token123', 'NewPass1');

      expect(result).toBe(true);
      expect(store.error).toBeNull();
    });

    it('returns false and sets error on failure', async () => {
      mockFetchResponse(false, { error: 'Invalid token' });
      const store = useAuthStore();

      const result = await store.resetPasswordWithToken('badtoken', 'NewPass1');

      expect(result).toBe(false);
      expect(store.error).toBe('Invalid token');
    });
  });

  describe('loading states', () => {
    it('loading transitions correctly during login', async () => {
      let resolvePromise: (value: unknown) => void;
      globalThis.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );
      const store = useAuthStore();

      const loginPromise = store.login('alice', 'password');
      expect(store.loading).toBe(true);

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1', username: 'alice', displayName: 'Alice' } }),
      });
      await loginPromise;

      expect(store.loading).toBe(false);
    });
  });
});
