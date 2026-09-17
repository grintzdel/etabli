import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  test: {
    name: '@etabli/mobile',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules'],
    environment: 'node',
    globals: false,
  },
})
