import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    name: '@etabli/ui',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules'],
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: false,
  },
})
