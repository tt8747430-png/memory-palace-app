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

/**
 * Returns the boundary rules config with optional extra cross-feature allow
 * rules appended. Use this instead of `boundaryRules` when a feature needs a
 * deliberately-scoped exception (e.g. spatial-canvas → nodes).
 *
 * @param {Array<{from: unknown, allow: unknown}>} extraRules
 * @returns {import('eslint').Linter.Config[]}
 */
export function makeBoundaryRules(extraRules = []) {
  return [
    {
      plugins: { boundaries },
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
              ...extraRules,
            ],
          },
        ],
      },
    },
    prettierConfig,
  ];
}

/** @type {import('eslint').Linter.Config[]} */
export const boundaryRules = makeBoundaryRules();
