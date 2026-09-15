import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { users } from '../../infrastructure/database/schema/index.ts'
import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('onboarding and memberships', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('joins an atelier and marks the onboarding in the same transaction', async () => {
    const token = await harness.signIn(SEED.newcomer)

    const response = await api()
      .post('/onboarding/complete')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.forge, practice: ['bois', 'découpe laser'] })

    expect(response.status).toBe(201)
    expect(response.body.atelierSlug).toBe('la-forge-montreuil')
    expect(response.body.role).toBe('MEMBER')

    const [stored] = await harness.db.select().from(users).where(eq(users.id, SEED.user.newcomer))
    expect(stored?.onboardingCompletedAt).not.toBeNull()
    expect(stored?.practice).toEqual(['bois', 'découpe laser'])
  })

  it('is idempotent on a second call', async () => {
    const token = await harness.signIn(SEED.newcomer)
    const payload = { atelierId: SEED.atelier.forge, practice: ['bois'] }

    await api().post('/onboarding/complete').set('authorization', bearer(token)).send(payload)
    const second = await api().post('/onboarding/complete').set('authorization', bearer(token)).send(payload)

    expect(second.status).toBe(201)

    const ateliers = await api()
      .get('/me/ateliers')
      .set('authorization', bearer(await harness.signIn(SEED.newcomer)))
    expect(ateliers.body).toHaveLength(1)
  })

  it('refuses a draft atelier with a 404', async () => {
    const token = await harness.signIn(SEED.newcomer)

    const response = await api()
      .post('/onboarding/complete')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.draft, practice: ['bois'] })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('ATELIER_NOT_JOINABLE')
  })

  it('refuses an onboarding without a practice', async () => {
    const token = await harness.signIn(SEED.newcomer)

    const response = await api()
      .post('/onboarding/complete')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.forge, practice: [] })

    expect(response.status).toBe(400)
  })

  it('names the ateliers of the caller, which the public directory cannot', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api().get('/me/ateliers').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.map((atelier: { readonly slug: string }) => atelier.slug).toSorted()).toEqual([
      'copeaux-et-cie-bastille',
      'la-forge-montreuil',
    ])
  })

  it('lets a platform admin name a fabmanager', async () => {
    const token = await harness.signIn(SEED.admin)

    const response = await api()
      .patch(`/admin/ateliers/${SEED.atelier.forge}/members/${SEED.user.member}`)
      .set('authorization', bearer(token))
      .send({ role: 'FABMANAGER' })

    expect(response.status).toBe(200)
    expect(response.body.role).toBe('FABMANAGER')
  })

  it('answers 404 on a membership that does not exist', async () => {
    const token = await harness.signIn(SEED.admin)

    const response = await api()
      .patch(`/admin/ateliers/${SEED.atelier.lyon}/members/${SEED.user.newcomer}`)
      .set('authorization', bearer(token))
      .send({ role: 'FABMANAGER' })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('MEMBERSHIP_UNKNOWN')
  })

  it('answers 403 to a member who is not a platform admin', async () => {
    const token = await harness.signIn(SEED.member)

    const response = await api()
      .patch(`/admin/ateliers/${SEED.atelier.forge}/members/${SEED.user.member}`)
      .set('authorization', bearer(token))
      .send({ role: 'FABMANAGER' })

    expect(response.status).toBe(403)
  })
})
