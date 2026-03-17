import { baseConfig } from '@memory-palace/eslint-config';

/** @type {import('eslint').Linter.Config[]} */
export default [...baseConfig, { ignores: ['dist/'] }];
