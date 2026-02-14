import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Add server apps when we add them
 */
const serverApps = [
  'templates/api-server/**/*.ts',
  'packages/database/**/*.ts',
  'apps/finance-tracker/src/server/**/*.ts',
];

export default [
  // Global ignores
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/public/**'],
  },

  // Base JS config
  js.configs.recommended,

  // TypeScript configs
  ...tseslint.configs.recommended,

  // Vue configs for client
  ...pluginVue.configs['flat/recommended'],

  // Vue-specific settings
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // Server-specific settings
  {
    files: serverApps,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier config (must be last to override other formatting rules)
  eslintConfigPrettier,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
