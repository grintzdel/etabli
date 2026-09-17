import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { renderThemeCss } from './theme-css'

describe('theme.css', () => {
  it('matches what the tokens generate', () => {
    const onDisk = readFileSync(resolve(import.meta.dirname, 'theme.css'), 'utf8')

    expect(onDisk).toBe(renderThemeCss())
  })
})
