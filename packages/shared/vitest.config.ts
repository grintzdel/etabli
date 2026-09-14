import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/shared',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
