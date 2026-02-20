import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createApiComposable } from '../composables/useApi.js';
import type { AuthUser } from '../types.js';

export interface AuthClientConfig {
  csrfCookieName: string;
  /** Route to push after successful login or registration. Default: '/' */
  loginRedirect?: string;
  /** Route to push after logout. Default: '/login' */
  logoutRedirect?: string;
}

/**
 * Creates a Pinia auth store bound to the given client config.
 *
 * Call this once at app startup and export the result as `useAuthStore`:
 *
 * ```ts
 * // src/stores/auth.ts
 * import { createAuthStore } from '@workspace/login/client';
 * export const useAuthStore = createAuthStore({ csrfCookieName: 'my_csrf' });
 * ```
 *
 * Vue views in the package import `useAuthStore` from `@/stores/auth` via the
 * app's path alias, so no changes to the view files are needed.
 */
export function createAuthStore(clientConfig: AuthClientConfig) {
  const loginRedirect = clientConfig.loginRedirect ?? '/';
  const logoutRedirect = clientConfig.logoutRedirect ?? '/login';
  const api = createApiComposable(clientConfig.csrfCookieName);

  return defineStore('auth', () => {
    // useRouter() is resolved from the active Vue app context when the store
    // is first accessed inside a component or navigation guard.
    const router = useRouter();

    const user = ref<AuthUser | null>(null);
    const isChecked = ref(false);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const isAuthenticated = computed(() => !!user.value);

    async function checkSession() {
      if (isChecked.value) return;
      loading.value = true;
      error.value = null;

      const result = await api<AuthUser>('/api/auth/me');

      if (result.success && result.data) {
        user.value = result.data;
      } else {
        user.value = null;
      }

      isChecked.value = true;
      loading.value = false;
    }

    async function login(username: string, password: string) {
      loading.value = true;
      error.value = null;

      const result = await api<AuthUser>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (result.success && result.data) {
        user.value = result.data;
        await router.push(loginRedirect);
      } else {
        error.value = result.error || 'Login failed';
      }

      loading.value = false;
    }

    async function register(
      username: string,
      displayName: string,
      password: string,
      email: string
    ) {
      loading.value = true;
      error.value = null;

      const result = await api<AuthUser>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, displayName, password, email }),
      });

      if (result.success && result.data) {
        user.value = result.data;
        await router.push(loginRedirect);
      } else {
        error.value = result.error || 'Registration failed';
      }

      loading.value = false;
    }

    async function logout() {
      loading.value = true;
      error.value = null;

      await api('/api/auth/logout', { method: 'POST' });

      user.value = null;
      loading.value = false;
      await router.push(logoutRedirect);
    }

    async function forgotPassword(username: string): Promise<boolean> {
      loading.value = true;
      error.value = null;

      const result = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });

      if (!result.success) {
        error.value = result.error || 'Request failed';
        loading.value = false;
        return false;
      }

      loading.value = false;
      return true;
    }

    async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
      loading.value = true;
      error.value = null;

      const result = await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });

      if (!result.success) {
        error.value = result.error || 'Password reset failed';
        loading.value = false;
        return false;
      }

      loading.value = false;
      return true;
    }

    return {
      user,
      isChecked,
      loading,
      error,
      isAuthenticated,
      checkSession,
      login,
      register,
      logout,
      forgotPassword,
      resetPasswordWithToken,
    };
  });
}

// Package-internal default export so that views can resolve
// `import { useAuthStore } from '@/stores/auth'` for IDE type-checking.
// Consuming apps override this by exporting their own useAuthStore via
// createAuthStore(config) from their own @/stores/auth module.
export const useAuthStore = createAuthStore({ csrfCookieName: 'csrf' });
