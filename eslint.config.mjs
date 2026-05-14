import storybook from 'eslint-plugin-storybook';

import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import boundaries from 'eslint-plugin-boundaries';
import prettierConfig from 'eslint-config-prettier';

const extraBoundaryRules = [
  {
    from: [['feature', { feature: 'spatial-canvas' }]],
    allow: [['feature', { feature: 'nodes' }]],
  },
];

const boundaryRules = [
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
            ...extraBoundaryRules,
          ],
        },
      ],
    },
  },
  prettierConfig,
];

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
            'Accent palette tokens (gold/emerald/rose/cyan/amber) are not part of the semantic palette — use primary/accent/success/warning instead. See ADR 9C.',
        },
      ],
    },
  }, // shadcn-style primitives in src/ui/ are wrappers around Radix. Content/labels/
  // associations are provided by consumers, and ref composition follows Radix's
  // own pattern — relax the rules that produce false positives for this layer.
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'jsx-a11y/heading-has-content': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'apps/**/.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.claude/**',
    '.idea/**',
    '.vscode/**',
    'drizzle/**',
    'coverage/**',
  ]),
  ...storybook.configs['flat/recommended'],
]);

export default eslintConfig;
