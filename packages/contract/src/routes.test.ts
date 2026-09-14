import { describe, expect, it } from 'vitest'

import { buildPath } from './build-path'
import { flattenRoutes, routes } from './routes'

describe('routes', () => {
  it('exposes every documented namespace', () => {
    expect(Object.keys(routes).toSorted()).toEqual(
      [
        'admin',
        'ateliers',
        'auth',
        'bookings',
        'certifications',
        'health',
        'machines',
        'manage',
        'me',
        'onboarding',
      ].toSorted()
    )
  })

  it('declares every path as an absolute path', () => {
    const offenders = flattenRoutes(routes).filter(([, path]) => !path.startsWith('/'))
    expect(offenders).toEqual([])
  })

  it('uses only well-formed named segments', () => {
    const offenders = flattenRoutes(routes).filter(([, path]) => /:(?![A-Za-z])/.test(path))
    expect(offenders).toEqual([])
  })

  it('resolves the parameterised booking check-in route', () => {
    expect(buildPath(routes.bookings.checkIn, { id: 'b-1' })).toBe('/bookings/b-1/check-in')
  })

  it('keeps the atelier public page addressable by slug', () => {
    expect(buildPath(routes.ateliers.getBySlug, { slug: 'montreuil' })).toBe('/ateliers/montreuil')
  })
})
