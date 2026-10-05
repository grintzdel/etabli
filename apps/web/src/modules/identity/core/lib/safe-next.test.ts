import { describe, expect, it } from 'vitest'

import { safeNext } from './safe-next'

describe('safeNext', () => {
  it('keeps a path of the site, query string included', () => {
    expect(safeNext('/machines/m-1?creneau=2026-10-06T06:00:00.000Z', '/compte')).toBe(
      '/machines/m-1?creneau=2026-10-06T06:00:00.000Z'
    )
  })

  it.each(['https://evil.example', '//evil.example', 'machines', '', null, undefined])(
    'falls back when the target is %s',
    (candidate) => {
      expect(safeNext(candidate, '/compte')).toBe('/compte')
    }
  )
})
