import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { SqlClient } from '@effect/sql'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import { afterAll, describe, expect, it } from 'vitest'

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

const FORGE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LYON = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const UNKNOWN = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

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

await seedAtelier(FORGE, 'la-forge')
await seedAtelier(LYON, 'lyon')

const register = async (displayName = 'Camille Roux'): Promise<{ token: string; userId: string }> => {
  const response = await send('POST', '/auth/register', {
    email: `cert-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName,
  })
  const body = (await response.json()) as { token: string; user: { id: string } }
  return { token: body.token, userId: body.user.id }
}

const join = async (
  atelierId: string,
  role: 'MEMBER' | 'FABMANAGER',
  displayName = 'Camille Roux'
): Promise<string> => {
  const { token, userId } = await register(displayName)
  await runtime.runPromise(
    sql`
      INSERT INTO memberships (id, user_id, atelier_id, role, status)
      VALUES (${globalThis.crypto.randomUUID()}, ${userId}, ${atelierId}, ${role}, 'ACTIVE')
    `
  )
  return token
}

const addMachine = async (
  atelierId: string,
  name: string,
  requiresCertification = true
): Promise<{ id: string; fabmanager: string }> => {
  const fabmanager = await join(atelierId, 'FABMANAGER', 'Alex Fabmanager')
  const response = await send(
    'POST',
    '/manage/machines',
    { atelierId, name, kind: 'LASER_CUTTER', requiresCertification },
    fabmanager
  )
  const body = (await response.json()) as { id: string }
  return { id: body.id, fabmanager }
}

const request = (machineId: string, token: string) => send('POST', '/certifications/request', { machineId }, token)
const mine = (token: string) => send('GET', '/certifications/mine', undefined, token)
const queue = (token: string) => send('GET', '/manage/certifications', undefined, token)

describe('POST /certifications/request', () => {
  it('records a pending request on a machine of the atelier the member joined', async () => {
    const machine = await addMachine(FORGE, 'Trotec')
    const member = await join(FORGE, 'MEMBER')

    const response = await request(machine.id, member)
    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body['status']).toBe('PENDING')
    expect(body['decidedAt']).toBeNull()
  })

  it('answers 409 on a second request for the same machine', async () => {
    const machine = await addMachine(FORGE, 'Prusa')
    const member = await join(FORGE, 'MEMBER')

    await request(machine.id, member)
    expect((await request(machine.id, member)).status).toBe(409)
  })

  it('answers 404 on a machine of an atelier the member never joined', async () => {
    const machine = await addMachine(FORGE, 'Hors de portée')
    const stranger = await join(LYON, 'MEMBER')

    expect((await request(machine.id, stranger)).status).toBe(404)
  })

  it('answers 404 on a machine that needs no habilitation', async () => {
    const machine = await addMachine(FORGE, 'Établi libre', false)
    const member = await join(FORGE, 'MEMBER')

    expect((await request(machine.id, member)).status).toBe(404)
  })

  it('answers 404 on a machine that does not exist', async () => {
    const member = await join(FORGE, 'MEMBER')
    expect((await request(UNKNOWN, member)).status).toBe(404)
  })

  it('answers 401 without a token', async () => {
    const machine = await addMachine(FORGE, 'Anonyme')
    expect((await request(machine.id, undefined as unknown as string)).status).toBe(401)
  })
})

describe('GET /certifications/mine', () => {
  it('lists every certifiable machine of the ateliers joined, asked for or not', async () => {
    const machine = await addMachine(FORGE, 'Shapeoko')
    const member = await join(FORGE, 'MEMBER')

    const before = (await (await mine(member)).json()) as ReadonlyArray<Record<string, unknown>>
    const untouched = before.find((item) => item['machineName'] === 'Shapeoko')
    expect(untouched?.['status']).toBe('NONE')
    expect(untouched?.['certificationId']).toBeNull()

    await request(machine.id, member)

    const after = (await (await mine(member)).json()) as ReadonlyArray<Record<string, unknown>>
    const asked = after.find((item) => item['machineName'] === 'Shapeoko')
    expect(asked?.['status']).toBe('PENDING')
    expect(asked?.['atelierSlug']).toBe('la-forge')
  })

  it('answers nothing to an account that joined no atelier', async () => {
    const { token } = await register()
    expect((await (await mine(token)).json()) as ReadonlyArray<unknown>).toEqual([])
  })
})

describe('the review queue', () => {
  it('shows the fabmanager who asks for what, on which machine', async () => {
    const machine = await addMachine(FORGE, 'Zund')
    const member = await join(FORGE, 'MEMBER', 'Camille Demandeuse')
    await request(machine.id, member)

    const body = (await (await queue(machine.fabmanager)).json()) as ReadonlyArray<Record<string, unknown>>
    const row = body.find((item) => item['machineName'] === 'Zund')
    expect(row?.['memberName']).toBe('Camille Demandeuse')
    expect(row?.['status']).toBe('PENDING')
  })

  it('answers nothing to a plain member', async () => {
    const member = await join(FORGE, 'MEMBER')
    expect((await (await queue(member)).json()) as ReadonlyArray<unknown>).toEqual([])
  })

  it('keeps out the requests of another atelier', async () => {
    const machine = await addMachine(FORGE, 'Cachée')
    const member = await join(FORGE, 'MEMBER')
    await request(machine.id, member)
    const elsewhere = await join(LYON, 'FABMANAGER')

    const body = (await (await queue(elsewhere)).json()) as ReadonlyArray<Record<string, unknown>>
    expect(body.some((item) => item['machineName'] === 'Cachée')).toBe(false)
  })
})

describe('granting and revoking', () => {
  it('grants the habilitation, and the member sees it', async () => {
    const machine = await addMachine(FORGE, 'Accordée')
    const member = await join(FORGE, 'MEMBER')
    const created = (await (await request(machine.id, member)).json()) as { id: string }

    const response = await send('POST', `/manage/certifications/${created.id}/grant`, undefined, machine.fabmanager)
    expect(response.status).toBe(200)

    const body = (await (await mine(member)).json()) as ReadonlyArray<Record<string, unknown>>
    const row = body.find((item) => item['machineName'] === 'Accordée')
    expect(row?.['status']).toBe('GRANTED')
    expect(row?.['decidedAt']).not.toBeNull()
  })

  it('revokes a granted habilitation', async () => {
    const machine = await addMachine(FORGE, 'Révoquée')
    const member = await join(FORGE, 'MEMBER')
    const created = (await (await request(machine.id, member)).json()) as { id: string }

    await send('POST', `/manage/certifications/${created.id}/grant`, undefined, machine.fabmanager)
    await send('POST', `/manage/certifications/${created.id}/revoke`, undefined, machine.fabmanager)

    const body = (await (await mine(member)).json()) as ReadonlyArray<Record<string, unknown>>
    expect(body.find((item) => item['machineName'] === 'Révoquée')?.['status']).toBe('REVOKED')
  })

  it('lets a member ask again after a revocation', async () => {
    const machine = await addMachine(FORGE, 'Seconde chance')
    const member = await join(FORGE, 'MEMBER')
    const created = (await (await request(machine.id, member)).json()) as { id: string }
    await send('POST', `/manage/certifications/${created.id}/revoke`, undefined, machine.fabmanager)

    const again = await request(machine.id, member)
    expect(again.status).toBe(201)
    expect(((await again.json()) as Record<string, unknown>)['status']).toBe('PENDING')
  })

  it('answers 404 to a fabmanager of another atelier', async () => {
    const machine = await addMachine(FORGE, 'Protégée')
    const member = await join(FORGE, 'MEMBER')
    const created = (await (await request(machine.id, member)).json()) as { id: string }
    const elsewhere = await join(LYON, 'FABMANAGER')

    expect((await send('POST', `/manage/certifications/${created.id}/grant`, undefined, elsewhere)).status).toBe(404)
  })

  it('answers 404 the same way to the member who asked', async () => {
    const machine = await addMachine(FORGE, 'Pas soi-même')
    const member = await join(FORGE, 'MEMBER')
    const created = (await (await request(machine.id, member)).json()) as { id: string }

    expect((await send('POST', `/manage/certifications/${created.id}/grant`, undefined, member)).status).toBe(404)
  })

  it('answers 404 on a certification that does not exist', async () => {
    const machine = await addMachine(FORGE, 'Inexistante')
    expect((await send('POST', `/manage/certifications/${UNKNOWN}/grant`, undefined, machine.fabmanager)).status).toBe(
      404
    )
  })
})
