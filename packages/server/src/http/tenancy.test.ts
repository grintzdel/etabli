import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const runtime = ManagedRuntime.make(PgLiteSqlClientLayer({ withAllMigrations: true }))
const sql = await runtime.runPromise(SqlClient.SqlClient)

const { dispose, handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(Layer.provide(Layer.succeed(SqlClient.SqlClient, sql)))
)

afterAll(async () => {
  await dispose()
  await runtime.dispose()
})

const FORGE = 'd1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1'
const LYON = 'd2d2d2d2-d2d2-4d2d-8d2d-d2d2d2d2d2d2'

const send = (method: string, path: string, body?: unknown, token?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  )

const seedAtelier = (id: string, slug: string) =>
  runtime.runPromise(
    sql`
      INSERT INTO ateliers (id, slug, name, description, city, latitude, longitude, status)
      VALUES (${id}, ${slug}, ${slug}, 'Un atelier partagé', 'Montreuil', 48.8638, 2.4485, 'PUBLISHED')
    `
  )

const enrol = async (
  atelierId: string,
  role: 'MEMBER' | 'FABMANAGER'
): Promise<{ readonly token: string; readonly userId: string }> => {
  const response = await send('POST', '/auth/register', {
    email: `tenancy-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const { token, user } = (await response.json()) as { token: string; user: { id: string } }
  await runtime.runPromise(
    sql`
      INSERT INTO memberships (id, user_id, atelier_id, role, status)
      VALUES (${globalThis.crypto.randomUUID()}, ${user.id}, ${atelierId}, ${role}, 'ACTIVE')
    `
  )
  return { token, userId: user.id }
}

interface Fixture {
  readonly machineId: string
  readonly bookingId: string
  readonly certificationId: string
  readonly memberId: string
  readonly outsider: string
  readonly insider: string
}

let fixture: Fixture

beforeAll(async () => {
  await seedAtelier(FORGE, 'la-forge-tenancy')
  await seedAtelier(LYON, 'lyon-tenancy')

  const owner = await enrol(FORGE, 'FABMANAGER')
  const member = await enrol(FORGE, 'MEMBER')
  const outside = await enrol(LYON, 'FABMANAGER')

  const created = await send(
    'POST',
    '/manage/machines',
    { atelierId: FORGE, name: 'Trotec cloisonnée', kind: 'LASER_CUTTER', slotDurationMinutes: 60 },
    owner.token
  )
  const { id: machineId } = (await created.json()) as { id: string }

  const bookingRows = await runtime.runPromise(
    sql<{ id: string }>`
      INSERT INTO bookings (id, machine_id, atelier_id, user_id, start_at, end_at)
      VALUES (${globalThis.crypto.randomUUID()}, ${machineId}, ${FORGE}, ${member.userId}, now(), now() + interval '1 hour')
      RETURNING id
    `
  )

  const certificationRows = await runtime.runPromise(
    sql<{ id: string }>`
      INSERT INTO certifications (id, user_id, machine_id, status, requested_at)
      VALUES (${globalThis.crypto.randomUUID()}, ${member.userId}, ${machineId}, 'PENDING', now())
      RETURNING id
    `
  )

  fixture = {
    machineId,
    bookingId: bookingRows[0]?.id ?? '',
    certificationId: certificationRows[0]?.id ?? '',
    memberId: member.userId,
    outsider: outside.token,
    insider: member.token,
  }
})

interface Guarded {
  readonly name: string
  readonly method: string
  readonly path: () => string
  readonly body?: () => unknown
  readonly expected: number
}

const GUARDED: ReadonlyArray<Guarded> = [
  {
    name: 'POST /manage/machines on another atelier',
    method: 'POST',
    path: () => '/manage/machines',
    body: () => ({ atelierId: FORGE, name: 'Machine volée', kind: 'LASER_CUTTER' }),
    expected: 403,
  },
  {
    name: 'PATCH /manage/machines/:id',
    method: 'PATCH',
    path: () => `/manage/machines/${fixture.machineId}`,
    body: () => ({ status: 'RETIRED' }),
    expected: 404,
  },
  {
    name: 'POST /manage/certifications/:id/grant',
    method: 'POST',
    path: () => `/manage/certifications/${fixture.certificationId}/grant`,
    expected: 404,
  },
  {
    name: 'POST /manage/certifications/:id/revoke',
    method: 'POST',
    path: () => `/manage/certifications/${fixture.certificationId}/revoke`,
    expected: 404,
  },
  {
    name: 'POST /manage/bookings/:id/check-in',
    method: 'POST',
    path: () => `/manage/bookings/${fixture.bookingId}/check-in`,
    expected: 404,
  },
  {
    name: 'POST /manage/bookings/:id/no-show',
    method: 'POST',
    path: () => `/manage/bookings/${fixture.bookingId}/no-show`,
    expected: 404,
  },
  {
    name: 'POST /manage/bookings/:id/cancel',
    method: 'POST',
    path: () => `/manage/bookings/${fixture.bookingId}/cancel`,
    expected: 404,
  },
  { name: 'GET /admin/ateliers', method: 'GET', path: () => '/admin/ateliers', expected: 403 },
  {
    name: 'POST /admin/ateliers',
    method: 'POST',
    path: () => '/admin/ateliers',
    body: () => ({
      slug: 'atelier-vole',
      name: 'Atelier volé',
      description: 'x',
      city: 'Montreuil',
      latitude: 48.8,
      longitude: 2.4,
    }),
    expected: 403,
  },
  {
    name: 'PATCH /admin/ateliers/:id',
    method: 'PATCH',
    path: () => `/admin/ateliers/${FORGE}`,
    body: () => ({ status: 'CLOSED' }),
    expected: 403,
  },
  {
    name: 'PATCH /admin/ateliers/:atelierId/members/:userId',
    method: 'PATCH',
    path: () => `/admin/ateliers/${FORGE}/members/${fixture.memberId}`,
    body: () => ({ role: 'FABMANAGER' }),
    expected: 403,
  },
  { name: 'GET /admin/users', method: 'GET', path: () => '/admin/users', expected: 403 },
  {
    name: 'PATCH /admin/users/:id',
    method: 'PATCH',
    path: () => `/admin/users/${fixture.memberId}`,
    body: () => ({ status: 'SUSPENDED' }),
    expected: 403,
  },
  { name: 'GET /admin/stats', method: 'GET', path: () => '/admin/stats', expected: 403 },
]

describe('cloisonnement · un fabmanager qui forge une requête vers un autre atelier', () => {
  it.each(GUARDED)('$name answers $expected and no data', async (route) => {
    const response = await send(route.method, route.path(), route.body?.(), fixture.outsider)

    expect(response.status).toBe(route.expected)
  })
})

describe('cloisonnement · un membre simple de l’atelier', () => {
  it.each(GUARDED)('$name answers $expected and no data', async (route) => {
    const response = await send(route.method, route.path(), route.body?.(), fixture.insider)

    expect(response.status).toBe(route.expected)
  })
})

describe('cloisonnement · sans jeton', () => {
  it.each(GUARDED)('$name answers 401', async (route) => {
    const response = await send(route.method, route.path(), route.body?.())

    expect(response.status).toBe(401)
  })
})

describe('cloisonnement · les collections ne portent rien de l’autre atelier', () => {
  it('GET /manage/machines hands the outsider only its own parc', async () => {
    const body = (await (await send('GET', '/manage/machines', undefined, fixture.outsider)).json()) as ReadonlyArray<{
      readonly atelier: { readonly id: string }
    }>

    expect(body.every((parc) => parc.atelier.id !== FORGE)).toBe(true)
  })

  it('GET /manage/bookings hands the outsider nothing of the other atelier', async () => {
    const body = (await (await send('GET', '/manage/bookings', undefined, fixture.outsider)).json()) as ReadonlyArray<{
      readonly atelierId: string
    }>

    expect(body.every((booking) => booking.atelierId !== FORGE)).toBe(true)
  })

  it('GET /manage/certifications hands the outsider nothing of the other atelier', async () => {
    const body = (await (
      await send('GET', '/manage/certifications', undefined, fixture.outsider)
    ).json()) as ReadonlyArray<{ readonly atelierId: string }>

    expect(body.every((entry) => entry.atelierId !== FORGE)).toBe(true)
  })

  it('GET /manage/stats measures nothing of the other atelier', async () => {
    const body = (await (await send('GET', '/manage/stats', undefined, fixture.outsider)).json()) as ReadonlyArray<{
      readonly atelierId: string
    }>

    expect(body.every((entry) => entry.atelierId !== FORGE)).toBe(true)
  })

  it('a plain member of the atelier runs no desk at all', async () => {
    expect(await (await send('GET', '/manage/bookings', undefined, fixture.insider)).json()).toStrictEqual([])
    expect(await (await send('GET', '/manage/stats', undefined, fixture.insider)).json()).toStrictEqual([])
    expect(await (await send('GET', '/manage/machines', undefined, fixture.insider)).json()).toStrictEqual([])
  })
})
