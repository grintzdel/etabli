import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    name: '@etabli/web',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['**/*.test.e2e.ts', 'node_modules', '.next'],
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: false,
  },
})
