import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        test: {
          name: 'client-example',
          root: 'apps/client-example',
          environment: 'jsdom',
          exclude: ['e2e/**', 'node_modules/**'],
        },
      },
      'apps/server-example/vitest.config.ts',
      'apps/full-stack-example/vitest.config.ts',
    ],
  },
});
