import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Safety rule from AGENTS.md: content, AI output and imports must never become code.
      'no-new-func': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    files: ['packages/ui/**/*.tsx', 'apps/**/*.tsx'],
    ...reactHooks.configs.flat['recommended-latest'],
  },
  {
    // The engine must stay platform-independent: no DOM, no React, no network.
    files: ['packages/engine/src/**/*.ts', 'packages/curriculum/src/**/*.ts', 'packages/i18n/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', '@barruu/ui', '@barruu/web'] }],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'fetch', 'navigator'],
    },
  },
  {
    files: ['scripts/**/*.{js,cjs,ts}'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Playwright scripts: callbacks passed to page.evaluate run in the browser.
    files: ['scripts/e2e/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
  },
);
