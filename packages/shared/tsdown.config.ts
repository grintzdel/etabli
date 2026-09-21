import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { 'http/index': 'src/http/index.ts' },
  format: 'esm',
  dts: true,
  clean: true,
})
