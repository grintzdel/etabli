import { fileURLToPath } from 'node:url'

import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    name: '@etabli/api',
    environment: 'node',
    globals: false,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/shared/testing/env.setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
})
