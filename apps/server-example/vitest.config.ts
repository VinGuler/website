import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    name: 'server-example',
    root: fileURLToPath(new URL('./', import.meta.url)),
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
