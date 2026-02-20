import type { ApiResponse } from '../types.js';

/**
 * Creates an API fetch wrapper that automatically injects the CSRF token from
 * the named cookie into every request header.
 */
export function createApiComposable(csrfCookieName: string) {
  function getCsrfToken(): string | null {
    const escaped = csrfCookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]+)`));
    return match ? match[1] : null;
  }

  return async function api<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const csrfToken = getCsrfToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        ...(options?.headers as Record<string, string>),
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        return { success: false, error: json.error || 'Request failed' };
      }

      return { success: true, data: json.data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { success: false, error: message };
    }
  };
}
