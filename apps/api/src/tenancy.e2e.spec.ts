import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from './shared/testing/seeded-app.harness.ts'

describe('tenancy', () => {
  let harness: SeededApp
  let memberToken: string
  let forgeFabmanagerToken: string
  let bookingId: string
  let certificationId: string

  beforeAll(async () => {
    harness = await makeSeededApp()
    memberToken = await harness.signIn(SEED.member)
    forgeFabmanagerToken = await harness.signIn(SEED.forgeFabmanager)

    const api = request(harness.app.getHttpServer())

    const booking = await api
      .post('/bookings')
      .set('authorization', bearer(memberToken))
      .send({ machineId: SEED.machine.copeauxBambu, startAt: '2026-09-16T06:00:00.000Z' })
    bookingId = booking.body.id

    const certification = await api
      .post('/certifications/request')
      .set('authorization', bearer(memberToken))
      .send({ machineId: SEED.machine.forgeLaser })
    certificationId = certification.body.id
  })

  afterAll(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  describe('a resource of another atelier answers 404, never 403', () => {
    it.each([
      ['GET /machines/:id/availability', 'member', () => api().get(`/machines/${SEED.machine.lyonJuki}/availability`)],
      [
        'PATCH /manage/machines/:id',
        'forge',
        () => api().patch(`/manage/machines/${SEED.machine.lyonJuki}`).send({ name: 'x' }),
      ],
      ['POST /manage/bookings/:id/check-in', 'forge', () => api().post(`/manage/bookings/${bookingId}/check-in`)],
      ['POST /manage/bookings/:id/cancel', 'forge', () => api().post(`/manage/bookings/${bookingId}/cancel`)],
      ['POST /manage/bookings/:id/no-show', 'forge', () => api().post(`/manage/bookings/${bookingId}/no-show`)],
    ])('%s answers 404', async (_route, who, call) => {
      const token = who === 'member' ? memberToken : forgeFabmanagerToken
      const response = await call().set('authorization', bearer(token))

      expect(response.status).toBe(404)
    })
  })

  describe('a resource of another member answers 404', () => {
    it.each([
      ['GET /bookings/:id', () => api().get(`/bookings/${bookingId}`)],
      ['POST /bookings/:id/cancel', () => api().post(`/bookings/${bookingId}/cancel`)],
      ['POST /bookings/:id/check-in', () => api().post(`/bookings/${bookingId}/check-in`).send({ nfcTagId: 'x' })],
    ])('%s answers 404', async (_route, call) => {
      const response = await call().set('authorization', bearer(forgeFabmanagerToken))

      expect(response.status).toBe(404)
    })
  })

  it('hides a certification of another atelier behind a 404', async () => {
    const lyon = await harness.signIn(SEED.lyonFabmanager)

    expect(
      (await api().post(`/manage/certifications/${certificationId}/grant`).set('authorization', bearer(lyon))).status
    ).toBe(404)
    expect(
      (await api().post(`/manage/certifications/${certificationId}/revoke`).set('authorization', bearer(lyon))).status
    ).toBe(404)
  })

  describe('a list answers empty rather than refusing', () => {
    it.each([
      ['GET /manage/machines', '/manage/machines'],
      ['GET /manage/bookings', '/manage/bookings'],
      ['GET /manage/certifications', '/manage/certifications'],
      ['GET /manage/stats', '/manage/stats'],
    ])('%s answers []', async (_route, path) => {
      const response = await api().get(path).set('authorization', bearer(memberToken))

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })
  })

  describe('the admin routes answer 403 to a member', () => {
    it.each([
      ['GET /admin/users', () => api().get('/admin/users')],
      ['PATCH /admin/users/:id', () => api().patch(`/admin/users/${SEED.user.member}`).send({ status: 'ACTIVE' })],
      ['GET /admin/ateliers', () => api().get('/admin/ateliers')],
      [
        'POST /admin/ateliers',
        () => api().post('/admin/ateliers').send({ slug: 'x', name: 'x', city: 'x', latitude: 0, longitude: 0 }),
      ],
      [
        'PATCH /admin/ateliers/:id',
        () => api().patch(`/admin/ateliers/${SEED.atelier.forge}`).send({ status: 'CLOSED' }),
      ],
      [
        'PATCH /admin/ateliers/:id/members/:userId',
        () =>
          api().patch(`/admin/ateliers/${SEED.atelier.forge}/members/${SEED.user.member}`).send({ role: 'FABMANAGER' }),
      ],
      ['GET /admin/stats', () => api().get('/admin/stats')],
    ])('%s answers 403', async (_route, call) => {
      const response = await call().set('authorization', bearer(memberToken))

      expect(response.status).toBe(403)
    })
  })

  describe('every guarded route answers 401 without a token', () => {
    it.each([
      ['GET /auth/me', () => api().get('/auth/me')],
      ['GET /bookings', () => api().get('/bookings')],
      ['GET /me/preferences', () => api().get('/me/preferences')],
      ['GET /me/ateliers', () => api().get('/me/ateliers')],
      ['GET /manage/machines', () => api().get('/manage/machines')],
      ['GET /admin/users', () => api().get('/admin/users')],
    ])('%s answers 401', async (_route, call) => {
      expect((await call()).status).toBe(401)
    })
  })

  it('leaves the public directory open', async () => {
    expect((await api().get('/ateliers')).status).toBe(200)
    expect((await api().get('/ateliers/la-forge-montreuil')).status).toBe(200)
    expect((await api().get('/health')).status).toBe(200)
  })
})
