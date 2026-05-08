import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/js/**/*.js'],
      exclude: ['src/js/modules/firebase-config.js', 'src/js/types.js'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
