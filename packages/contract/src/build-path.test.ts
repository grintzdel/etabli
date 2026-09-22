import { describe, expect, it } from 'vitest'

import { buildPath } from './build-path'
import type { PathTemplate } from './path-template'

const template = <K extends string>(raw: string): PathTemplate<K> => raw as unknown as PathTemplate<K>

describe('buildPath', () => {
  it('returns a template with nothing to substitute untouched', () => {
    expect(buildPath(template<never>('/ateliers'), {})).toBe('/ateliers')
  })

  it('substitutes a named segment', () => {
    expect(buildPath(template<'id'>('/bookings/:id/cancel'), { id: 'abc' })).toBe('/bookings/abc/cancel')
  })

  it('substitutes several named segments', () => {
    expect(buildPath(template<'a' | 'b'>('/:a/:b'), { a: 'one', b: 'two' })).toBe('/one/two')
  })

  it('encodes the substituted value', () => {
    expect(buildPath(template<'slug'>('/ateliers/:slug'), { slug: 'atelier de la butte' })).toBe(
      '/ateliers/atelier%20de%20la%20butte'
    )
  })

  it('throws when a parameter is missing', () => {
    expect(() => buildPath(template<'id'>('/bookings/:id'), {} as Readonly<Record<'id', string>>)).toThrow(
      'Missing path parameter ":id"'
    )
  })
})
