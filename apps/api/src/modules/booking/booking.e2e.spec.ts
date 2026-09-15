import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

const TOMORROW_MORNING = '2026-09-16T06:00:00.000Z'

describe('bookings', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  const book = async (token: string, machineId: string, startAt = TOMORROW_MORNING) =>
    api().post('/bookings').set('authorization', bearer(token)).send({ machineId, startAt })

  it('opens a week of slots on a machine of the member’s atelier', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api()
      .get(`/machines/${SEED.machine.copeauxBambu}/availability`)
      .set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body.slotDurationMinutes).toBe(180)
    expect(response.body.slots).toHaveLength(28)
    expect(response.body.atelierSlug).toBe('copeaux-et-cie-bastille')
  })

  it('answers 404 on a machine of an atelier the member has not joined', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api()
      .get(`/machines/${SEED.machine.lyonJuki}/availability`)
      .set('authorization', bearer(token))

    expect(response.status).toBe(404)
  })

  it('answers 404 on a retired machine, which is out of the parc', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api()
      .get(`/machines/${SEED.machine.forgeRetired}/availability`)
      .set('authorization', bearer(token))

    expect(response.status).toBe(404)
  })

  it('books a slot and reads it back', async () => {
    const token = await harness.signIn(SEED.member)
    const created = await book(token, SEED.machine.copeauxBambu)

    expect(created.status).toBe(201)
    expect(created.body.endAt).toBe('2026-09-16T09:00:00.000Z')
    expect(created.body.status).toBe('CONFIRMED')
    expect(created.body.canCancel).toBe(true)

    const listed = await api().get('/bookings').set('authorization', bearer(token))
    expect(listed.body.map((booking: { readonly id: string }) => booking.id)).toContain(created.body.id)
  })

  it('refuses the second booking on the same slot', async () => {
    const token = await harness.signIn(SEED.member)
    await book(token, SEED.machine.copeauxBambu)
    const second = await book(token, SEED.machine.copeauxBambu)

    expect(second.status).toBe(409)
    expect(second.body.code).toBe('BOOKING_OVERLAP')
  })

  it('refuses a machine that asks for a certification the member has not got', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await book(token, SEED.machine.forgeLaser)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('MISSING_CERTIFICATION')
  })

  it('refuses a machine under maintenance with a 409', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await book(token, SEED.machine.forgePrusa)

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('MACHINE_UNAVAILABLE')
  })

  it('refuses a slot already gone', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await book(token, SEED.machine.copeauxBambu, '2026-09-14T06:00:00.000Z')

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('SLOT_IN_THE_PAST')
  })

  it('refuses a start that is not an ISO instant', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await book(token, SEED.machine.copeauxBambu, 'demain matin')

    expect(response.status).toBe(400)
  })

  it('hides a booking that is not the caller’s behind a 404', async () => {
    const owner = await harness.signIn(SEED.member)
    const created = await book(owner, SEED.machine.copeauxBambu)

    const stranger = await harness.signIn(SEED.forgeFabmanager)
    const response = await api().get(`/bookings/${created.body.id}`).set('authorization', bearer(stranger))

    expect(response.status).toBe(404)
  })

  it('cancels a slot that has not started, and refuses the second attempt', async () => {
    const token = await harness.signIn(SEED.member)
    const created = await book(token, SEED.machine.copeauxBambu)

    const cancelled = await api().post(`/bookings/${created.body.id}/cancel`).set('authorization', bearer(token))

    expect(cancelled.status).toBe(200)
    expect(cancelled.body.status).toBe('CANCELLED')

    const again = await api().post(`/bookings/${created.body.id}/cancel`).set('authorization', bearer(token))
    expect(again.status).toBe(409)
    expect(again.body.code).toBe('BOOKING_NOT_CANCELLABLE')
  })

  it('stamps the slot with the machine tag, once and only inside the window', async () => {
    const token = await harness.signIn(SEED.member)
    const created = await book(token, SEED.machine.copeauxBambu)

    const early = await api()
      .post(`/bookings/${created.body.id}/check-in`)
      .set('authorization', bearer(token))
      .send({ nfcTagId: 'nfc-copeaux-bambu-01' })
    expect(early.status).toBe(409)
    expect(early.body.code).toBe('CHECK_IN_WINDOW_CLOSED')

    harness.clock.set('2026-09-16T05:50:00.000Z')

    const wrongTag = await api()
      .post(`/bookings/${created.body.id}/check-in`)
      .set('authorization', bearer(token))
      .send({ nfcTagId: 'nfc-forge-laser-01' })
    expect(wrongTag.status).toBe(409)
    expect(wrongTag.body.code).toBe('NFC_TAG_MISMATCH')

    const stamped = await api()
      .post(`/bookings/${created.body.id}/check-in`)
      .set('authorization', bearer(token))
      .send({ nfcTagId: 'nfc-copeaux-bambu-01' })
    expect(stamped.status).toBe(200)
    expect(stamped.body.status).toBe('CHECKED_IN')

    const twice = await api()
      .post(`/bookings/${created.body.id}/check-in`)
      .set('authorization', bearer(token))
      .send({ nfcTagId: 'nfc-copeaux-bambu-01' })
    expect(twice.status).toBe(409)
    expect(twice.body.code).toBe('BOOKING_NOT_CHECK_INABLE')
  })

  it('projects COMPLETED once a stamped slot has run its course', async () => {
    const token = await harness.signIn(SEED.member)
    const created = await book(token, SEED.machine.copeauxBambu)

    harness.clock.set('2026-09-16T05:50:00.000Z')
    await api()
      .post(`/bookings/${created.body.id}/check-in`)
      .set('authorization', bearer(token))
      .send({ nfcTagId: 'nfc-copeaux-bambu-01' })

    harness.clock.set('2026-09-16T09:30:00.000Z')
    const detail = await api().get(`/bookings/${created.body.id}`).set('authorization', bearer(token))

    expect(detail.body.status).toBe('COMPLETED')
  })
})
