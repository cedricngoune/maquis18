// @ts-check
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * One ESLint config for the whole monorepo (ESLint "flat config").
 * Formatting is Prettier's job: eslint-config-prettier, last, turns off every style rule.
 */
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**', '**/coverage/**', '**/next-env.d.ts'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // Allow intentionally unused arguments/variables when prefixed with "_" (e.g. it.each labels)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ---------- API (NestJS, Node) ----------
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Test doubles are easier to write with a few loose types
    files: ['apps/api/**/*.spec.ts', 'apps/api/test/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // ---------- Web (Next.js, React) ----------
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
    settings: { next: { rootDir: 'apps/web' } },
  },

  // ---------- Config files (CommonJS / ESM scripts) ----------
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },

  prettier,
);
