import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildImportGraph, isProduction, resolveSpecifier } from './import-graph'

const appRoot = resolve(import.meta.dirname, '../..')
const graph = buildImportGraph(appRoot)

describe('import graph', () => {
  it('is actually populated', () => {
    expect(graph.files.length).toBeGreaterThan(5)
    expect(graph.edgeCount).toBeGreaterThan(3)
  })

  it('counts production files only', () => {
    expect(graph.files.some((file) => file.endsWith('.test.ts'))).toBe(false)
    expect(graph.files.some((file) => file.endsWith('.test.tsx'))).toBe(false)
    expect(graph.files.some((file) => file.endsWith('.test.e2e.ts'))).toBe(false)
    expect(graph.files.some((file) => file.startsWith('src/e2e/'))).toBe(false)
  })
})

describe('resolveSpecifier', () => {
  const known = new Set(graph.files)
  const importer = 'src/features/marketing/home/home.page.tsx'

  it('resolves the alias form', () => {
    expect(resolveSpecifier('@/ui/Button', importer, known)).toBe('src/ui/Button.tsx')
  })

  it('resolves the relative form to the same file as the alias form', () => {
    expect(resolveSpecifier('../../../ui/Button', importer, known)).toBe(
      resolveSpecifier('@/ui/Button', importer, known)
    )
  })

  it('returns null for a bare package specifier', () => {
    expect(resolveSpecifier('next/link', importer, known)).toBeNull()
    expect(resolveSpecifier('react', importer, known)).toBeNull()
  })
})

describe('isProduction', () => {
  it('accepts a component', () => {
    expect(isProduction('src/ui/Button.tsx')).toBe(true)
  })

  it('rejects a unit test, an e2e test and an ambient declaration', () => {
    expect(isProduction('src/ui/Button.test.tsx')).toBe(false)
    expect(isProduction('src/features/marketing/home/home.test.e2e.ts')).toBe(false)
    expect(isProduction('next-env.d.ts')).toBe(false)
  })
})
