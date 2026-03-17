import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import prettierConfig from 'eslint-config-prettier';

/** Base config for non-Next.js packages (TypeScript + Prettier) */
export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
);

/** @type {import('eslint').Linter.Config[]} */
export const boundaryRules = [
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'shared', pattern: 'src/shared/*' },
        { type: 'app', pattern: 'src/app/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'feature', allow: ['shared'] },
            { from: 'app', allow: ['feature', 'shared'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
  prettierConfig,
];
