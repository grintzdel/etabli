import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/server',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
})
