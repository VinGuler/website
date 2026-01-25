import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'client-example',
          root: 'packages/client-example',
          environment: 'jsdom',
        },
        plugins: [vue()],
      },
      'packages/server-example/vitest.config.ts',
      'packages/full-stack-example/vitest.config.ts',
    ],
  },
});
