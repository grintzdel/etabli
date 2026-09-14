import { describe, expect, it } from 'vitest'

import { buildPath } from './build-path'

describe('buildPath', () => {
  it('returns a literal path untouched', () => {
    expect(buildPath('/ateliers')).toBe('/ateliers')
  })

  it('substitutes a named segment', () => {
    expect(buildPath('/bookings/:id/cancel', { id: 'abc' })).toBe('/bookings/abc/cancel')
  })

  it('substitutes several named segments', () => {
    expect(buildPath('/:a/:b', { a: 'one', b: 'two' })).toBe('/one/two')
  })

  it('encodes the substituted value', () => {
    expect(buildPath('/ateliers/:slug', { slug: 'atelier de la butte' })).toBe('/ateliers/atelier%20de%20la%20butte')
  })

  it('throws when a parameter is missing', () => {
    expect(() => buildPath('/bookings/:id', {})).toThrow('Missing path parameter ":id"')
  })
})
