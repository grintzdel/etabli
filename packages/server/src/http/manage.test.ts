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

const FORGE = '77777777-7777-4777-8777-777777777777'
const LYON = '88888888-8888-4888-8888-888888888888'
const UNKNOWN = '99999999-9999-4999-8999-999999999999'

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

const register = async (): Promise<{ readonly token: string; readonly userId: string }> => {
  const response = await send('POST', '/auth/register', {
    email: `parc-${globalThis.crypto.randomUUID()}@etabli.test`,
    password: 'un-mot-de-passe',
    displayName: 'Camille Roux',
  })
  const body = (await response.json()) as { token: string; user: { id: string } }
  return { token: body.token, userId: body.user.id }
}

const join = async (atelierId: string, role: 'MEMBER' | 'FABMANAGER'): Promise<string> => {
  const { token, userId } = await register()
  await runtime.runPromise(
    sql`
      INSERT INTO memberships (id, user_id, atelier_id, role, status)
      VALUES (${globalThis.crypto.randomUUID()}, ${userId}, ${atelierId}, ${role}, 'ACTIVE')
    `
  )
  return token
}

const machine = (atelierId: string, name: string) => ({
  atelierId,
  name,
  description: 'Découpe laser 100 W',
  kind: 'LASER_CUTTER',
})

describe('POST /manage/machines', () => {
  it('puts a machine on the floor of the atelier the fabmanager runs', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const response = await send('POST', '/manage/machines', machine(FORGE, 'Trotec Speedy'), token)

    expect(response.status).toBe(201)
    const body = (await response.json()) as Record<string, unknown>
    expect(body['status']).toBe('AVAILABLE')
    expect(body['requiresCertification']).toBe(true)
    expect(body['slotDurationMinutes']).toBe(60)
  })

  it('shows up at once on the public sheet of the atelier', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    await send('POST', '/manage/machines', machine(FORGE, 'Prusa MK4'), token)

    const sheet = (await (await send('GET', '/ateliers/la-forge')).json()) as {
      machines: ReadonlyArray<{ name: string }>
    }
    expect(sheet.machines.some((item) => item.name === 'Prusa MK4')).toBe(true)
  })

  it('answers 403 to a plain member of that atelier', async () => {
    const token = await join(FORGE, 'MEMBER')
    expect((await send('POST', '/manage/machines', machine(FORGE, 'Refusée'), token)).status).toBe(403)
  })

  it('answers 403 to a fabmanager of another atelier', async () => {
    const token = await join(LYON, 'FABMANAGER')
    expect((await send('POST', '/manage/machines', machine(FORGE, 'Refusée'), token)).status).toBe(403)
  })

  it('answers 401 without a token', async () => {
    expect((await send('POST', '/manage/machines', machine(FORGE, 'Anonyme'))).status).toBe(401)
  })

  it('answers 400 on a slot outside the allowed range', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const payload = { ...machine(FORGE, 'Créneau absurde'), slotDurationMinutes: 5 }
    expect((await send('POST', '/manage/machines', payload, token)).status).toBe(400)
  })

  it('answers 400 on a machine kind that does not exist', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const payload = { ...machine(FORGE, 'Inconnue'), kind: 'TELEPORTEUR' }
    expect((await send('POST', '/manage/machines', payload, token)).status).toBe(400)
  })
})

describe('PATCH /manage/machines/:id', () => {
  it('sends a machine to maintenance, and the public sheet says so', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const created = (await (await send('POST', '/manage/machines', machine(FORGE, 'Shapeoko'), token)).json()) as {
      id: string
    }

    const response = await send('PATCH', `/manage/machines/${created.id}`, { status: 'MAINTENANCE' }, token)
    expect(response.status).toBe(200)

    const sheet = (await (await send('GET', '/ateliers/la-forge')).json()) as {
      machines: ReadonlyArray<{ name: string; status: string }>
    }
    expect(sheet.machines.find((item) => item.name === 'Shapeoko')?.status).toBe('MAINTENANCE')
  })

  it('retires a machine, which removes it from the public sheet', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const created = (await (await send('POST', '/manage/machines', machine(FORGE, 'Vieille scie'), token)).json()) as {
      id: string
    }

    await send('PATCH', `/manage/machines/${created.id}`, { status: 'RETIRED' }, token)

    const sheet = (await (await send('GET', '/ateliers/la-forge')).json()) as {
      machines: ReadonlyArray<{ name: string }>
    }
    expect(sheet.machines.some((item) => item.name === 'Vieille scie')).toBe(false)
  })

  it('answers 404 on a machine of an atelier the caller does not run', async () => {
    const owner = await join(FORGE, 'FABMANAGER')
    const created = (await (await send('POST', '/manage/machines', machine(FORGE, 'Protégée'), owner)).json()) as {
      id: string
    }
    const stranger = await join(LYON, 'FABMANAGER')

    expect((await send('PATCH', `/manage/machines/${created.id}`, { status: 'RETIRED' }, stranger)).status).toBe(404)
  })

  it('answers 404 on a machine that does not exist', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    expect((await send('PATCH', `/manage/machines/${UNKNOWN}`, { status: 'RETIRED' }, token)).status).toBe(404)
  })

  it('sticks an nfc tag on a machine, then peels it off', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const created = (await (await send('POST', '/manage/machines', machine(FORGE, 'Taggable'), token)).json()) as {
      id: string
    }

    const tagged = await send('PATCH', `/manage/machines/${created.id}`, { nfcTagId: 'tag-taggable' }, token)
    expect(tagged.status).toBe(200)
    expect(((await tagged.json()) as Record<string, unknown>)['nfcTagId']).toBe('tag-taggable')

    const peeled = await send('PATCH', `/manage/machines/${created.id}`, { nfcTagId: null }, token)
    expect(((await peeled.json()) as Record<string, unknown>)['nfcTagId']).toBeNull()
  })

  it('leaves the tag in place when the patch does not mention it', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const created = (await (await send('POST', '/manage/machines', machine(FORGE, 'Tag gardé'), token)).json()) as {
      id: string
    }
    await send('PATCH', `/manage/machines/${created.id}`, { nfcTagId: 'tag-garde' }, token)

    const response = await send('PATCH', `/manage/machines/${created.id}`, { status: 'MAINTENANCE' }, token)

    expect(((await response.json()) as Record<string, unknown>)['nfcTagId']).toBe('tag-garde')
  })

  it('answers 409 on a tag already stuck on another machine', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    const first = (await (await send('POST', '/manage/machines', machine(FORGE, 'Porteuse'), token)).json()) as {
      id: string
    }
    const second = (await (await send('POST', '/manage/machines', machine(FORGE, 'Convoiteuse'), token)).json()) as {
      id: string
    }
    await send('PATCH', `/manage/machines/${first.id}`, { nfcTagId: 'tag-porteuse' }, token)

    const response = await send('PATCH', `/manage/machines/${second.id}`, { nfcTagId: 'tag-porteuse' }, token)

    expect(response.status).toBe(409)
    expect(((await response.json()) as Record<string, unknown>)['_tag']).toBe('MachineNfcTagTakenError')
  })
})

describe('GET /manage/machines', () => {
  it('answers one parc per atelier the caller fabmanages', async () => {
    const token = await join(FORGE, 'FABMANAGER')
    await send('POST', '/manage/machines', machine(FORGE, 'Machine du parc'), token)

    const body = (await (await send('GET', '/manage/machines', undefined, token)).json()) as ReadonlyArray<{
      atelier: { slug: string }
      machines: ReadonlyArray<{ name: string }>
    }>

    expect(body).toHaveLength(1)
    expect(body[0]?.atelier.slug).toBe('la-forge')
    expect(body[0]?.machines.some((item) => item.name === 'Machine du parc')).toBe(true)
  })

  it('answers nothing to a plain member', async () => {
    const token = await join(FORGE, 'MEMBER')
    const body = (await (await send('GET', '/manage/machines', undefined, token)).json()) as ReadonlyArray<unknown>
    expect(body).toEqual([])
  })

  it('answers 401 without a token', async () => {
    expect((await send('GET', '/manage/machines')).status).toBe(401)
  })
})
