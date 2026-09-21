import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

const TOMORROW_MORNING = '2026-09-16T06:00:00.000Z'

describe('booking management', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  const bookedSlot = async (): Promise<string> => {
    const token = await harness.signIn(SEED.member)
    const created = await api()
      .post('/bookings')
      .set('authorization', bearer(token))
      .send({ machineId: SEED.machine.copeauxBambu, startAt: TOMORROW_MORNING })

    return created.body.id as string
  }

  it('shows the fabmanager the slots of the day, member name included', async () => {
    await bookedSlot()
    harness.clock.set(TOMORROW_MORNING)

    const token = await harness.signIn(SEED.copeauxFabmanager)
    const response = await api().get('/manage/bookings').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].memberName).toBe('Camille Roux')
    expect(response.body[0].canCheckIn).toBe(true)
  })

  it('answers an empty list to a member who runs no atelier', async () => {
    await bookedSlot()
    const token = await harness.signIn(SEED.member)

    const response = await api().get('/manage/bookings').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('filters the day by effective state', async () => {
    await bookedSlot()
    harness.clock.set(TOMORROW_MORNING)
    const token = await harness.signIn(SEED.copeauxFabmanager)

    const confirmed = await api()
      .get('/manage/bookings')
      .query({ status: 'CONFIRMED' })
      .set('authorization', bearer(token))
    const completed = await api()
      .get('/manage/bookings')
      .query({ status: 'COMPLETED' })
      .set('authorization', bearer(token))

    expect(confirmed.body).toHaveLength(1)
    expect(completed.body).toEqual([])
  })

  it('stamps a slot by hand, with MANUAL as the method', async () => {
    const bookingId = await bookedSlot()
    harness.clock.set('2026-09-16T05:50:00.000Z')

    const token = await harness.signIn(SEED.copeauxFabmanager)
    const response = await api().post(`/manage/bookings/${bookingId}/check-in`).set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('CHECKED_IN')
    expect(response.body.checkedInVia).toBe('MANUAL')
  })

  it('marks an absence once the check-in window has closed, and not before', async () => {
    const bookingId = await bookedSlot()
    const token = await harness.signIn(SEED.copeauxFabmanager)

    harness.clock.set('2026-09-16T06:30:00.000Z')
    const early = await api().post(`/manage/bookings/${bookingId}/no-show`).set('authorization', bearer(token))
    expect(early.status).toBe(409)
    expect(early.body.code).toBe('BOOKING_NOT_MARKABLE_AS_NO_SHOW')

    harness.clock.set('2026-09-16T06:31:00.000Z')
    const marked = await api().post(`/manage/bookings/${bookingId}/no-show`).set('authorization', bearer(token))
    expect(marked.status).toBe(200)
    expect(marked.body.status).toBe('NO_SHOW')
  })

  it('calls a slot off until its end, where the member closes at its start', async () => {
    const bookingId = await bookedSlot()
    const token = await harness.signIn(SEED.copeauxFabmanager)

    harness.clock.set('2026-09-16T07:00:00.000Z')
    const response = await api().post(`/manage/bookings/${bookingId}/cancel`).set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('CANCELLED')
  })

  it('hides a slot of another atelier from a fabmanager, behind a 404', async () => {
    const bookingId = await bookedSlot()
    const token = await harness.signIn(SEED.forgeFabmanager)

    harness.clock.set('2026-09-16T05:50:00.000Z')
    const response = await api().post(`/manage/bookings/${bookingId}/check-in`).set('authorization', bearer(token))

    expect(response.status).toBe(404)
  })

  it('measures the occupancy of the ateliers the fabmanager runs', async () => {
    await bookedSlot()
    harness.clock.set('2026-09-16T09:30:00.000Z')

    const token = await harness.signIn(SEED.copeauxFabmanager)
    const response = await api().get('/manage/stats').query({ period: '7d' }).set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].atelierName).toBe('Copeaux & Cie')
    expect(response.body[0].openHours).toBe(98)
    expect(response.body[0].bookings).toBe(1)
    expect(response.body[0].bookedHours).toBe(3)
    expect(response.body[0].consumedHours).toBe(0)
  })

  it('reads the network only for a platform admin', async () => {
    const admin = await harness.signIn(SEED.admin)
    const member = await harness.signIn(SEED.member)

    const allowed = await api().get('/admin/stats').set('authorization', bearer(admin))
    const refused = await api().get('/admin/stats').set('authorization', bearer(member))

    expect(allowed.status).toBe(200)
    expect(allowed.body.ateliers).toBeGreaterThan(0)
    expect(refused.status).toBe(403)
  })
})
