import { fileURLToPath } from 'node:url';
import { defineConfig, configDefaults } from 'vitest/config';
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
      {
        test: {
          name: 'login-server',
          root: 'packages/login',
          environment: 'node',
          include: ['src/server/**/*.spec.ts'],
          exclude: [...configDefaults.exclude, 'dist/**'],
        },
      },
      {
        plugins: [vue()],
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./packages/login/src/client', import.meta.url)),
          },
        },
        test: {
          name: 'login-client',
          root: 'packages/login',
          environment: 'jsdom',
          include: ['src/client/**/*.spec.ts'],
          exclude: [...configDefaults.exclude, 'dist/**'],
        },
      },
      'apps/finance-tracker/vitest.config.ts',
      'apps/job-tracker/vitest.config.ts',
    ],
  },
});
