import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        test: {
          name: 'landing-page',
          root: 'templates/landing-page',
          environment: 'jsdom',
          exclude: ['e2e/**', 'node_modules/**'],
        },
      },
      'templates/api-server/vitest.config.ts',
      'templates/client-server/vitest.config.ts',
      'templates/client-server-database/vitest.config.ts',
      'packages/database/vitest.config.ts',
      'apps/finance-tracker/vitest.config.ts',
    ],
  },
});
