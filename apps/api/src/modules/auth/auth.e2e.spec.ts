import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('auth', () => {
  let harness: SeededApp

  beforeAll(async () => {
    harness = await makeSeededApp()
  })

  afterAll(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('registers an account and hands back a session', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ email: 'Nouvelle@Etabli.test', password: 'un-mot-de-passe', displayName: 'Awa Diop' })

    expect(response.status).toBe(201)
    expect(response.body.user.email).toBe('nouvelle@etabli.test')
    expect(response.body.user.platformRole).toBe('MEMBER')
    expect(response.body.token).toEqual(expect.any(String))
  })

  it('refuses an address already taken', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ email: SEED.member, password: 'un-mot-de-passe', displayName: 'Doublon' })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('EMAIL_ALREADY_TAKEN')
  })

  it('refuses a password below eight characters', async () => {
    const response = await api()
      .post('/auth/register')
      .send({ email: 'court@etabli.test', password: 'court', displayName: 'Court' })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  it('answers the same refusal for an unknown address and a wrong password', async () => {
    const unknown = await api().post('/auth/login').send({ email: 'fantome@etabli.test', password: 'peu-importe' })
    const wrong = await api().post('/auth/login').send({ email: SEED.member, password: 'mauvais-mot-de-passe' })

    expect(unknown.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(unknown.body.code).toBe(wrong.body.code)
  })

  it('refuses a suspended account at sign-in', async () => {
    const response = await api().post('/auth/login').send({ email: SEED.suspended, password: SEED.password })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('reads the session and its memberships', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api().get('/auth/me').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.email).toBe(SEED.member)
    expect(response.body.memberships).toHaveLength(2)
  })

  it('refuses a request without a bearer token', async () => {
    expect((await api().get('/auth/me')).status).toBe(401)
  })

  it('changes the password and reissues a token that still works', async () => {
    const token = await harness.signIn(SEED.newcomer)

    const changed = await api()
      .post('/auth/password')
      .set('authorization', bearer(token))
      .send({ currentPassword: SEED.password, newPassword: 'un-nouveau-mot-de-passe' })

    expect(changed.status).toBe(200)

    const reused = await api().get('/auth/me').set('authorization', bearer(changed.body.token))
    expect(reused.status).toBe(200)

    const stale = await api().post('/auth/login').send({ email: SEED.newcomer, password: SEED.password })
    expect(stale.status).toBe(401)
  })

  it('refuses a password change that does not know the current one', async () => {
    const token = await harness.signIn(SEED.member)

    const response = await api()
      .post('/auth/password')
      .set('authorization', bearer(token))
      .send({ currentPassword: 'pas-le-bon', newPassword: 'un-autre-mot-de-passe' })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('INVALID_CREDENTIALS')
  })
})
