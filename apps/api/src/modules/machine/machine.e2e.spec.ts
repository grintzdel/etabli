import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('machine parcs', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('shows the fabmanager the parcs of the ateliers they run, retired machines included', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)
    const response = await api().get('/manage/machines').set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].atelier.slug).toBe('la-forge-montreuil')
    expect(response.body[0].machines).toHaveLength(5)
  })

  it('answers an empty list to a member who runs no atelier', async () => {
    const token = await harness.signIn(SEED.member)
    const response = await api().get('/manage/machines').set('authorization', bearer(token))

    expect(response.body).toEqual([])
  })

  it('adds a machine, with the default slot and the default habilitation', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const response = await api()
      .post('/manage/machines')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.forge, name: 'Fraiseuse neuve', kind: 'CNC_MILL' })

    expect(response.status).toBe(201)
    expect(response.body.slotDurationMinutes).toBe(60)
    expect(response.body.requiresCertification).toBe(true)
    expect(response.body.status).toBe('AVAILABLE')
    expect(response.body.checkInToken).toEqual(expect.any(String))
  })

  it('refuses a fabmanager who adds a machine to someone else’s atelier', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const response = await api()
      .post('/manage/machines')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.lyon, name: 'Intruse', kind: 'SEWING' })

    expect(response.status).toBe(403)
  })

  it('refuses a slot duration outside the bounds', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const response = await api()
      .post('/manage/machines')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.forge, name: 'Trop longue', kind: 'CNC_MILL', slotDurationMinutes: 600 })

    expect(response.status).toBe(400)
  })

  it('leaves the check-in token alone when the machine is renamed', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const renamed = await api()
      .patch(`/manage/machines/${SEED.machine.forgeLaser}`)
      .set('authorization', bearer(token))
      .send({ name: 'Trotec Speedy 400 — atelier bois' })

    expect(renamed.body.checkInToken).toBe('qr-forge-laser-01')
  })

  it('refuses a caller who writes the check-in token by hand', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const response = await api()
      .patch(`/manage/machines/${SEED.machine.forgeLaser}`)
      .set('authorization', bearer(token))
      .send({ checkInToken: 'qr-choisi-a-la-main' })

    expect(response.status).toBe(400)
  })

  it('regenerates the check-in token, and the printed sticker stops working', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const regenerated = await api()
      .post(`/manage/machines/${SEED.machine.forgeLaser}/check-in-token`)
      .set('authorization', bearer(token))

    expect(regenerated.status).toBe(201)
    expect(regenerated.body.checkInToken).not.toBe('qr-forge-laser-01')
  })

  it('hides the check-in token of another atelier behind a 404', async () => {
    const token = await harness.signIn(SEED.lyonFabmanager)

    const response = await api()
      .post(`/manage/machines/${SEED.machine.forgeLaser}/check-in-token`)
      .set('authorization', bearer(token))

    expect(response.status).toBe(404)
  })

  it('hides a machine of another atelier behind a 404', async () => {
    const token = await harness.signIn(SEED.forgeFabmanager)

    const response = await api()
      .patch(`/manage/machines/${SEED.machine.lyonJuki}`)
      .set('authorization', bearer(token))
      .send({ name: 'Intruse' })

    expect(response.status).toBe(404)
  })
})

describe('public machine detail', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('hands the fiche of a machine to a visitor who carries no token', async () => {
    const response = await api().get(`/machines/${SEED.machine.copeauxBambu}`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: SEED.machine.copeauxBambu,
      name: 'Bambu Lab P1S',
      atelierSlug: 'copeaux-et-cie-bastille',
      atelierName: 'Copeaux & Cie',
      kind: 'PRINTER_3D',
      requiresCertification: false,
      slotDurationMinutes: 180,
      status: 'AVAILABLE',
    })
  })

  it('keeps the check-in token out of the public fiche', async () => {
    const response = await api().get(`/machines/${SEED.machine.forgeLaser}`)

    expect(response.status).toBe(200)
    expect(response.body).not.toHaveProperty('checkInToken')
  })

  it('shows a machine under maintenance, since the fiche is not a booking', async () => {
    const response = await api().get(`/machines/${SEED.machine.forgePrusa}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('MAINTENANCE')
  })

  it('hides a retired machine behind a 404, signed in or not', async () => {
    const anonymous = await api().get(`/machines/${SEED.machine.forgeRetired}`)
    expect(anonymous.status).toBe(404)

    const token = await harness.signIn(SEED.forgeFabmanager)
    const fabmanager = await api().get(`/machines/${SEED.machine.forgeRetired}`).set('authorization', bearer(token))
    expect(fabmanager.status).toBe(404)
  })

  it('answers 404 on a machine that never existed', async () => {
    const response = await api().get('/machines/00000000-0000-4000-8000-000000000000')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('MACHINE_UNKNOWN')
  })

  it('refuses an id that is not a uuid', async () => {
    expect((await api().get('/machines/pas-un-uuid')).status).toBe(400)
  })
})
