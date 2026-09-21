import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiErrorCode } from '@etabli/contract'
import { describe, expect, it } from 'vitest'

const SRC_DIR = fileURLToPath(new URL('.', import.meta.url))

const sourceFiles = (dir: string): ReadonlyArray<string> =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [path] : []
  })

const sources = sourceFiles(SRC_DIR).map((path) => ({
  path: path.slice(SRC_DIR.length),
  text: readFileSync(path, 'utf8'),
}))

describe('api error codes', () => {
  it('names no error code outside the contract', () => {
    const literals = sources.filter((source) => /\bcode:\s*['"`]/.test(source.text)).map((source) => source.path)

    expect(literals).toEqual([])
  })

  it('emits every code the contract declares', () => {
    const emitted = new Set(
      sources.flatMap((source) =>
        [...source.text.matchAll(/\bcode: ApiErrorCode\.([A-Z_]+)/g)].map((match) => match[1] ?? '')
      )
    )

    expect(Object.keys(ApiErrorCode).filter((code) => !emitted.has(code))).toEqual([])
  })
})
