import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '$app/environment': fileURLToPath(new URL('./tests/unit/mocks/app-environment.ts', import.meta.url)),
      '$lib': fileURLToPath(new URL('./src/lib', import.meta.url))
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: true,
    clearMocks: true
  }
});
