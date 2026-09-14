import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8')) as Record<
  string,
  unknown
>

describe('@etabli/contract', () => {
  it('declares no runtime dependency', () => {
    expect(manifest['dependencies']).toBeUndefined()
  })

  it('declares no peer dependency', () => {
    expect(manifest['peerDependencies']).toBeUndefined()
  })
})
