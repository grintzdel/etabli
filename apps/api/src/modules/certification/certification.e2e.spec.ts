import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('certifications', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  const requestFor = async (machineId: string) => {
    const token = await harness.signIn(SEED.member)
    return api().post('/certifications/request').set('authorization', bearer(token)).send({ machineId })
  }

  it('opens a request on a machine of the member’s atelier', async () => {
    const response = await requestFor(SEED.machine.forgeLaser)

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('PENDING')
  })

  it('refuses a second request while one is open', async () => {
    await requestFor(SEED.machine.forgeLaser)
    const second = await requestFor(SEED.machine.forgeLaser)

    expect(second.status).toBe(409)
    expect(second.body.code).toBe('CERTIFICATION_ALREADY_REQUESTED')
  })

  it('answers 404 on a machine of an atelier the member has not joined', async () => {
    const response = await requestFor(SEED.machine.lyonJuki)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('MACHINE_NOT_CERTIFIABLE')
  })

  it('lists the machines that ask for a habilitation, with the state of each', async () => {
    await requestFor(SEED.machine.forgeLaser)
    const token = await harness.signIn(SEED.member)

    const response = await api().get('/certifications/mine').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    const laser = response.body.find(
      (entry: { readonly machineId: string }) => entry.machineId === SEED.machine.forgeLaser
    )
    expect(laser.status).toBe('PENDING')
    expect(response.body.every((entry: { readonly status: string }) => entry.status !== undefined)).toBe(true)
    expect(response.body.some((entry: { readonly status: string }) => entry.status === 'NONE')).toBe(true)
  })

  it('shows the queue to the fabmanager of the atelier, and grants a request', async () => {
    const opened = await requestFor(SEED.machine.forgeLaser)
    const fabmanager = await harness.signIn(SEED.forgeFabmanager)

    const queue = await api().get('/manage/certifications').set('authorization', bearer(fabmanager))
    expect(queue.status).toBe(200)
    expect(queue.body).toHaveLength(1)
    expect(queue.body[0].memberName).toBe('Camille Roux')

    const granted = await api()
      .post(`/manage/certifications/${opened.body.id}/grant`)
      .set('authorization', bearer(fabmanager))

    expect(granted.status).toBe(200)
    expect(granted.body.status).toBe('GRANTED')
  })

  it('unlocks the booking of a machine once the habilitation is granted', async () => {
    const opened = await requestFor(SEED.machine.forgeLaser)
    const fabmanager = await harness.signIn(SEED.forgeFabmanager)
    await api().post(`/manage/certifications/${opened.body.id}/grant`).set('authorization', bearer(fabmanager))

    const member = await harness.signIn(SEED.member)
    const booked = await api()
      .post('/bookings')
      .set('authorization', bearer(member))
      .send({ machineId: SEED.machine.forgeLaser, startAt: '2026-09-16T06:00:00.000Z' })

    expect(booked.status).toBe(201)
  })

  it('lets a revoked habilitation be asked for again', async () => {
    const opened = await requestFor(SEED.machine.forgeLaser)
    const fabmanager = await harness.signIn(SEED.forgeFabmanager)
    await api().post(`/manage/certifications/${opened.body.id}/revoke`).set('authorization', bearer(fabmanager))

    const reopened = await requestFor(SEED.machine.forgeLaser)

    expect(reopened.status).toBe(201)
    expect(reopened.body.status).toBe('PENDING')
  })

  it('hides a request of another atelier behind a 404', async () => {
    const opened = await requestFor(SEED.machine.forgeLaser)
    const stranger = await harness.signIn(SEED.lyonFabmanager)

    const response = await api()
      .post(`/manage/certifications/${opened.body.id}/grant`)
      .set('authorization', bearer(stranger))

    expect(response.status).toBe(404)
  })

  it('answers an empty queue to a member who runs no atelier', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api().get('/manage/certifications').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})
