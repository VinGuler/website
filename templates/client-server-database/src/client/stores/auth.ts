import { createAuthStore } from '@workspace/login/client';

export const useAuthStore = createAuthStore({ csrfCookieName: 'app_csrf' });
