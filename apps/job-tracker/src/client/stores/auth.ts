import { createAuthStore } from '@workspace/login/client';

export const useAuthStore = createAuthStore({ csrfCookieName: 'jt_csrf' });
