import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@etabli/bc-identity',
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
