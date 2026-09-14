import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/contract',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
