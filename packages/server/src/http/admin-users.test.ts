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

const UNKNOWN = '66666666-6666-4666-8666-666666666666'

interface AdminUser {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: string
  readonly status: string
  readonly createdAt: string
}

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

const register = async (
  displayName = 'Camille Roux'
): Promise<{ readonly token: string; readonly userId: string; readonly email: string }> => {
  const email = `users-${globalThis.crypto.randomUUID()}@etabli.test`
  const response = await send('POST', '/auth/register', { email, password: 'un-mot-de-passe', displayName })
  const body = (await response.json()) as { token: string; user: { id: string } }
  return { token: body.token, userId: body.user.id, email }
}

const promote = async (): Promise<{ readonly token: string; readonly userId: string }> => {
  const { token, userId } = await register('Inès Ferrand')
  await runtime.runPromise(sql`UPDATE users SET platform_role = 'PLATFORM_ADMIN' WHERE id = ${userId}`)
  return { token, userId }
}

const listUsers = (token?: string, query = '') => send('GET', `/admin/users${query}`, undefined, token)
const patchUser = (id: string, body: unknown, token?: string) => send('PATCH', `/admin/users/${id}`, body, token)

describe('GET /admin/users', () => {
  it('finds an account by its address', async () => {
    const { token } = await promote()
    const camille = await register()

    const response = await listUsers(token, `?search=${encodeURIComponent(camille.email)}`)
    expect(response.status).toBe(200)

    const body = (await response.json()) as ReadonlyArray<AdminUser>
    expect(body).toHaveLength(1)
    expect(body[0]?.id).toBe(camille.userId)
    expect(body[0]?.platformRole).toBe('MEMBER')
    expect(body[0]?.status).toBe('ACTIVE')
  })

  it('never hands back the password hash', async () => {
    const { token } = await promote()
    const camille = await register()

    const body = (await (
      await listUsers(token, `?search=${encodeURIComponent(camille.email)}`)
    ).json()) as ReadonlyArray<Record<string, unknown>>
    expect(body[0]).not.toHaveProperty('passwordHash')
  })

  it('narrows to the suspended accounts', async () => {
    const { token } = await promote()
    const camille = await register()
    await patchUser(camille.userId, { status: 'SUSPENDED' }, token)

    const body = (await (
      await listUsers(token, `?status=SUSPENDED&search=${encodeURIComponent(camille.email)}`)
    ).json()) as ReadonlyArray<AdminUser>
    expect(body.map((user) => user.id)).toStrictEqual([camille.userId])
  })

  it('reads a wildcard of the search as a plain character', async () => {
    const { token } = await promote()
    await register()

    const body = (await (await listUsers(token, '?search=%25')).json()) as ReadonlyArray<AdminUser>
    expect(body).toStrictEqual([])
  })

  it('answers 403 to a plain member', async () => {
    const { token } = await register()

    expect((await listUsers(token)).status).toBe(403)
  })

  it('answers 401 without a token', async () => {
    expect((await listUsers()).status).toBe(401)
  })
})

describe('PATCH /admin/users/:id', () => {
  it('names a member as platform admin', async () => {
    const { token } = await promote()
    const camille = await register()

    const response = await patchUser(camille.userId, { platformRole: 'PLATFORM_ADMIN' }, token)
    expect(response.status).toBe(200)
    expect(((await response.json()) as AdminUser).platformRole).toBe('PLATFORM_ADMIN')
  })

  it('suspends an account and closes the door behind it', async () => {
    const { token } = await promote()
    const camille = await register()

    expect((await patchUser(camille.userId, { status: 'SUSPENDED' }, token)).status).toBe(200)
    expect((await send('GET', '/auth/me', undefined, camille.token)).status).toBe(403)
  })

  it('lets a suspended account back in', async () => {
    const { token } = await promote()
    const camille = await register()
    await patchUser(camille.userId, { status: 'SUSPENDED' }, token)

    await patchUser(camille.userId, { status: 'ACTIVE' }, token)
    expect((await send('GET', '/auth/me', undefined, camille.token)).status).toBe(200)
  })

  it('leaves untouched what the patch does not name', async () => {
    const { token } = await promote()
    const camille = await register()
    await patchUser(camille.userId, { status: 'SUSPENDED' }, token)

    const body = (await (
      await patchUser(camille.userId, { platformRole: 'PLATFORM_ADMIN' }, token)
    ).json()) as AdminUser
    expect(body.status).toBe('SUSPENDED')
    expect(body.platformRole).toBe('PLATFORM_ADMIN')
  })

  it('refuses the admin who would lock itself out', async () => {
    const { token, userId } = await promote()

    const demote = await patchUser(userId, { platformRole: 'MEMBER' }, token)
    expect(demote.status).toBe(409)
    expect(((await demote.json()) as { _tag: string })._tag).toBe('AdminSelfLockoutError')

    expect((await patchUser(userId, { status: 'SUSPENDED' }, token)).status).toBe(409)
  })

  it('answers 404 on an account that does not exist', async () => {
    const { token } = await promote()

    expect((await patchUser(UNKNOWN, { status: 'SUSPENDED' }, token)).status).toBe(404)
  })

  it('answers 400 on a role nobody holds', async () => {
    const { token } = await promote()
    const camille = await register()

    expect((await patchUser(camille.userId, { platformRole: 'ROOT' }, token)).status).toBe(400)
  })

  it('answers 403 to a plain member', async () => {
    const { token } = await register()
    const camille = await register()

    expect((await patchUser(camille.userId, { status: 'SUSPENDED' }, token)).status).toBe(403)
  })

  it('answers 401 without a token', async () => {
    expect((await patchUser(UNKNOWN, { status: 'SUSPENDED' })).status).toBe(401)
  })
})
