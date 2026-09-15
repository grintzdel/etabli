import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('profile, preferences and accounts', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('patches the displayed name and leaves the practices alone', async () => {
    const token = await harness.signIn(SEED.member)

    const response = await api()
      .patch('/me/profile')
      .set('authorization', bearer(token))
      .send({ displayName: 'Camille R.' })

    expect(response.status).toBe(200)
    expect(response.body.displayName).toBe('Camille R.')
    expect(response.body.practice).toEqual(['impression 3D'])
  })

  it('answers the system theme when nothing has been chosen', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api().get('/me/preferences').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ theme: 'system', defaultAtelierId: null, updatedAt: null })
  })

  it('stores a theme, then clears the default atelier on an explicit null', async () => {
    const token = await harness.signIn(SEED.member)

    const stored = await api()
      .patch('/me/preferences')
      .set('authorization', bearer(token))
      .send({ theme: 'dark', defaultAtelierId: SEED.atelier.forge })
    expect(stored.body).toMatchObject({ theme: 'dark', defaultAtelierId: SEED.atelier.forge })

    const kept = await api().patch('/me/preferences').set('authorization', bearer(token)).send({ theme: 'light' })
    expect(kept.body).toMatchObject({ theme: 'light', defaultAtelierId: SEED.atelier.forge })

    const cleared = await api()
      .patch('/me/preferences')
      .set('authorization', bearer(token))
      .send({ defaultAtelierId: null })
    expect(cleared.body).toMatchObject({ theme: 'light', defaultAtelierId: null })
  })

  it('refuses a default atelier the member has not joined', async () => {
    const token = await harness.signIn(SEED.member)

    const response = await api()
      .patch('/me/preferences')
      .set('authorization', bearer(token))
      .send({ defaultAtelierId: SEED.atelier.lyon })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PREFERRED_ATELIER_NOT_JOINED')
  })

  it('refuses a theme it does not know', async () => {
    const token = await harness.signIn(SEED.member)

    const response = await api().patch('/me/preferences').set('authorization', bearer(token)).send({ theme: 'sépia' })

    expect(response.status).toBe(400)
  })

  it('browses the accounts and names their ateliers, for a platform admin only', async () => {
    const admin = await harness.signIn(SEED.admin)

    const response = await api().get('/admin/users').query({ search: 'camille' }).set('authorization', bearer(admin))

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].ateliers).toHaveLength(2)

    const member = await harness.signIn(SEED.member)
    expect((await api().get('/admin/users').set('authorization', bearer(member))).status).toBe(403)
  })

  it('suspends an account, which is refused at the next request', async () => {
    const victim = await harness.signIn(SEED.member)
    const admin = await harness.signIn(SEED.admin)

    const suspended = await api()
      .patch(`/admin/users/${SEED.user.member}`)
      .set('authorization', bearer(admin))
      .send({ status: 'SUSPENDED' })

    expect(suspended.status).toBe(200)
    expect(suspended.body.status).toBe('SUSPENDED')

    const refused = await api().get('/auth/me').set('authorization', bearer(victim))
    expect(refused.status).toBe(403)
    expect(refused.body.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('refuses an admin who locks themselves out', async () => {
    const admin = await harness.signIn(SEED.admin)

    const response = await api()
      .patch(`/admin/users/${SEED.user.admin}`)
      .set('authorization', bearer(admin))
      .send({ status: 'SUSPENDED' })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('ADMIN_SELF_LOCKOUT')
  })
})
