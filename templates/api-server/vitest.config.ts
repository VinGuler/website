import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    name: 'api-server',
    root: fileURLToPath(new URL('./', import.meta.url)),
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
