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

const send = (path: string): string => path

describe('route templates', () => {
  it('lets a parameterless route reach the transport directly', () => {
    expect(send(routes.bookings.list)).toBe('/bookings')
  })

  it('keeps a parameterised route away from the transport', () => {
    // @ts-expect-error a template must be resolved by buildPath before it is sent
    expect(send(routes.bookings.getById)).toBe('/bookings/:id')
  })

  it('names the parameter a template expects', () => {
    // @ts-expect-error the parameter is 'id', not 'bookingId'
    expect(() => buildPath(routes.bookings.getById, { bookingId: 'b-1' })).toThrow()
  })

  it('requires every parameter of a two-segment template', () => {
    // @ts-expect-error 'userId' is missing
    expect(() => buildPath(routes.admin.atelierMember, { atelierId: 'a-1' })).toThrow()
  })
})
