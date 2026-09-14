import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  deps: { neverBundle: ['@etabli/shared', 'effect', '@effect/sql', '@effect/experimental', '@electric-sql/pglite'] },
})
