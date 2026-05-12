import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import { makeBoundaryRules } from '@memory-palace/eslint-config';

const boundaryRules = makeBoundaryRules([
  {
    from: [['feature', { feature: 'spatial-canvas' }]],
    allow: [['feature', { feature: 'nodes' }]],
  },
]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaryRules,

  {
    rules: {
      ...jsxA11y.configs.strict.rules,

      'jsx-a11y/no-autofocus': 'off',

      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/app/(marketing)/**',
      'src/features/marketing/**',

      'src/app/_brand-icon.tsx',
      'src/app/opengraph-image.tsx',
      'src/app/icon.tsx',
      'src/app/apple-icon.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(?:text|bg|border|from|to|via|ring|fill|stroke)-(?:gold|emerald|rose|cyan|amber)(?!-)(?:\\/[0-9]+)?\\b/]',
          message:
            'Accent palette tokens (gold/emerald/rose/cyan/amber) are marketing-only — use semantic tokens (primary/accent/success/warning) instead. See ADR 9C.',
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
