import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from './shared/testing/seeded-app.harness.ts'

describe('ambient auth context', () => {
  let harness: SeededApp
  let member: string
  let admin: string
  let fabmanager: string

  beforeAll(async () => {
    harness = await makeSeededApp()
    ;[member, admin, fabmanager] = await Promise.all([
      harness.signIn(SEED.member),
      harness.signIn(SEED.admin),
      harness.signIn(SEED.forgeFabmanager),
    ])
  })

  afterAll(async () => {
    await harness.close()
  })

  const me = (token?: string) => {
    const call = request(harness.app.getHttpServer()).get('/auth/me')
    return token === undefined ? call : call.set('authorization', bearer(token))
  }

  it('hands each caller their own identity, never the one before them', async () => {
    expect((await me(member).expect(200)).body.id).toBe(SEED.user.member)
    expect((await me(admin).expect(200)).body.id).toBe(SEED.user.admin)
    expect((await me(fabmanager).expect(200)).body.id).toBe(SEED.user.forgeFabmanager)
    expect((await me(member).expect(200)).body.id).toBe(SEED.user.member)
  })

  it('refuses a caller who carries no token, rather than borrowing the last one seen', async () => {
    await me(admin).expect(200)

    await me().expect(401)
  })
})
