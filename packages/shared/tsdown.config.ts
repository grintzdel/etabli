import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/http/index.ts',
    'src/schema/index.ts',
    'src/errors/index.ts',
    'src/auth-context/index.ts',
    'src/time/index.ts',
    'src/id/index.ts',
    'src/type-level/index.ts',
    'src/migrations/index.ts',
  ],
  format: 'esm',
  dts: true,
  clean: true,
  deps: { neverBundle: ['effect'] },
})
