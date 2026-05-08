import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
// jsxA11y is imported only to access its configs.strict.rules — the plugin
// itself is already registered by eslint-config-next/core-web-vitals.
import { makeBoundaryRules } from '@memory-palace/eslint-config';

// Allow spatial-canvas → nodes cross-feature imports.
// The canvas is the primary UI layer for the nodes domain; the coupling is
// intentional and explicitly scoped here rather than in the shared config.
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
  // jsx-a11y strict ruleset — provides broader coverage than the subset
  // included in eslint-config-next/core-web-vitals.
  {
    rules: {
      ...jsxA11y.configs.strict.rules,
      // Radix Dialog manages focus internally; auto-focus on first tabbable
      // element is the correct pattern per ARIA authoring practices.
      'jsx-a11y/no-autofocus': 'off',
      // React Flow canvas nodes use pointer events, not raw onClick without
      // keyboard handlers — keep as warn until canvas node pattern is audited.
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  // Slice C / ADR 9C — accent palette tokens (gold/emerald/rose/cyan/amber)
  // are opt-in for marketing surfaces only. Product code must use the
  // semantic tokens (`primary`, `accent`, `success`, `warning`, …).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/app/(marketing)/**',
      'src/features/marketing/**',
      // The `_brand-icon` and OG image generators legitimately use brand
      // gradients on the marketing-adjacent assets shipped from `app/`.
      'src/app/_brand-icon.tsx',
      'src/app/opengraph-image.tsx',
      'src/app/icon.tsx',
      'src/app/apple-icon.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Match `text-gold` / `bg-emerald/20` / `from-rose` etc. — but
          // explicitly NOT Tailwind's numeric scale (`emerald-500`,
          // `rose-400`). Negative lookahead `(?!-)` rejects the dash that
          // would precede a Tailwind shade number.
          selector:
            'Literal[value=/\\b(?:text|bg|border|from|to|via|ring|fill|stroke)-(?:gold|emerald|rose|cyan|amber)(?!-)(?:\\/[0-9]+)?\\b/]',
          message:
            'Accent palette tokens (gold/emerald/rose/cyan/amber) are marketing-only — use semantic tokens (primary/accent/success/warning) instead. See ADR 9C.',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
