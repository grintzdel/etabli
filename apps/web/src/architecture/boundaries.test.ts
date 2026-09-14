import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { bareSpecifiersOf, buildImportGraph, findCycles, stripComments } from './import-graph'

const cwd = resolve(import.meta.dirname, '../..')
const graph = buildImportGraph(cwd)

const isFrameworkImport = (specifier: string): boolean =>
  specifier === 'react' ||
  specifier.startsWith('react/') ||
  specifier.startsWith('react-dom') ||
  specifier === 'next' ||
  specifier.startsWith('next/')

describe('module boundaries', () => {
  it('keeps React and Next out of every core/', () => {
    const offenders = graph.files
      .filter((file) => /^src\/modules\/[^/]+\/core\//.test(file))
      .flatMap((file) =>
        bareSpecifiersOf(cwd, file)
          .filter(isFrameworkImport)
          .map((spec) => `${file} -> ${spec}`)
      )

    expect(offenders).toEqual([])
  })

  it('keeps components out of features/', () => {
    const offenders = graph.files.filter(
      (file) => file.startsWith('src/features/') && file.endsWith('.tsx') && !file.endsWith('.page.tsx')
    )

    expect(offenders).toEqual([])
  })

  it('keeps production code out of src/testing/', () => {
    const offenders = [...graph.edges].flatMap(([importer, targets]) =>
      [...targets].filter((target) => target.startsWith('src/testing/')).map((target) => `${importer} -> ${target}`)
    )

    expect(offenders).toEqual([])
  })

  it('has no import cycle', () => {
    expect(findCycles(graph)).toEqual([])
  })
})

describe('workspace language rules', () => {
  const root = resolve(cwd, '../..')
  const sources = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

  it('declares no TypeScript enum anywhere', () => {
    const offenders = sources.filter((file) =>
      /(?:^|[\s;])(?:const\s+)?enum\s+[A-Za-z_$][\w$]*\s*\{/.test(stripComments(readFileSync(join(root, file), 'utf8')))
    )

    expect(offenders).toEqual([])
  })
})
