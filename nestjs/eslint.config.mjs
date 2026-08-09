// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // recommendedTypeChecked flags these as errors; the codebase already
      // treats unsafe access leniently (no-explicit-any off, no-unsafe-argument
      // warn), so keep them non-blocking warnings rather than failing the build.
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      // async methods kept async for interface conformance / test doubles are
      // legitimate here; don't fail the build on a missing await.
      '@typescript-eslint/require-await': 'warn',
      // `_`-prefixed args are the codebase's "intentionally unused" convention
      // (e.g. interface-conformant pipeline actions that ignore the state).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // Test files import from `bun:test`, whose module types don't resolve under
    // the eslint projectService -> a cascade of false-positive unsafe-* reports.
    // Silence them for tests: the reports are an eslint type-resolution gap, not
    // real unsafety (Bun runs these test files directly).
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    // The security boundary is excluded from the formatting pass on purpose (#280): a boundary file
    // is not reformatted unattended, so the human who reviews it confirms the reformat is
    // behavior-preserving. Keep its formatting from failing the lint check; keep every other lint
    // rule on it.
    files: ['src/security/turnstile.verifier.ts'],
    rules: {
      'prettier/prettier': 'off',
    },
  },
);
