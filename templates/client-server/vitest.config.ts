import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    name: 'client-server',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
    environmentMatchGlobs: [
      ['src/client/**', 'jsdom'],
      ['src/server/**', 'node'],
      ['src/__tests__/**', 'node'],
    ],
  },
});
