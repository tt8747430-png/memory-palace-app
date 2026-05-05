import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
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
  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
