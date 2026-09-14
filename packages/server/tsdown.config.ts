import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts', 'api/index.ts'],
  format: 'esm',
  dts: false,
  clean: true,
  deps: {
    neverBundle: [
      '@etabli/contract',
      '@etabli/shared',
      'effect',
      '@effect/platform',
      '@effect/platform-node',
      '@effect/sql',
      '@effect/sql-pg',
    ],
  },
})
