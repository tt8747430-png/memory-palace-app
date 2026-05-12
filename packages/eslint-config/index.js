import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import prettierConfig from 'eslint-config-prettier';

export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
);

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

export const boundaryRules = makeBoundaryRules();
