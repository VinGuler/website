// Types
export type { AuthUser, ApiResponse } from './types.js';

// Store factory
export type { AuthClientConfig } from './stores/auth.js';
export { createAuthStore } from './stores/auth.js';

// API composable factory
export { createApiComposable } from './composables/useApi.js';

// Vue views are NOT exported from this barrel — import them directly via the
// package's subpath export to avoid bundler issues with .vue files:
//
//   import LoginView from '@workspace/login/views/LoginView.vue';
//   import RegisterView from '@workspace/login/views/RegisterView.vue';
//   import ForgotPasswordView from '@workspace/login/views/ForgotPasswordView.vue';
//   import ResetPasswordView from '@workspace/login/views/ResetPasswordView.vue';
//
// The views use `useAuthStore` from `@/stores/auth` (resolved by the consuming
// app's Vite path alias), so the consuming app must export `useAuthStore` from
// that path. Typically:
//
//   // src/stores/auth.ts (in the consuming app)
//   import { createAuthStore } from '@workspace/login/client';
//   export const useAuthStore = createAuthStore({ csrfCookieName: 'my_csrf' });
