import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'login-server',
          root: fileURLToPath(new URL('./', import.meta.url)),
          environment: 'node',
          include: ['src/server/**/*.spec.ts'],
        },
      },
      {
        plugins: [vue()],
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('./src/client', import.meta.url)),
          },
        },
        test: {
          name: 'login-client',
          root: fileURLToPath(new URL('./', import.meta.url)),
          environment: 'jsdom',
          include: ['src/client/**/*.spec.ts'],
        },
      },
    ],
  },
});
