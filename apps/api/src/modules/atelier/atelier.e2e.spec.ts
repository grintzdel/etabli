import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { bearer, makeSeededApp, SEED, type SeededApp } from '../../shared/testing/seeded-app.harness.ts'

describe('ateliers', () => {
  let harness: SeededApp

  beforeEach(async () => {
    harness = await makeSeededApp()
  })

  afterEach(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it('opens the directory to anyone, without a token', async () => {
    const response = await api().get('/ateliers')

    expect(response.status).toBe(200)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body.map((atelier: { readonly slug: string }) => atelier.slug)).not.toContain(
      'atelier-en-preparation'
    )
  })

  it('refuses a query parameter it does not know', async () => {
    expect((await api().get('/ateliers').query({ inconnu: 'x' })).status).toBe(400)
  })

  it('refuses a point without its radius', async () => {
    expect((await api().get('/ateliers').query({ lat: 48.85, lng: 2.35 })).status).toBe(400)
  })

  it('shows the fiche of a published atelier, retired machines left out', async () => {
    const response = await api().get('/ateliers/la-forge-montreuil')

    expect(response.status).toBe(200)
    expect(response.body.machines).toHaveLength(4)
    expect(response.body.machines.every((machine: { readonly status: string }) => machine.status !== 'RETIRED')).toBe(
      true
    )
  })

  it('answers 404 on a draft atelier', async () => {
    const response = await api().get('/ateliers/atelier-en-preparation')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('ATELIER_NOT_FOUND')
  })

  it('opens an atelier as a draft, and publishes it afterwards', async () => {
    const token = await harness.signIn(SEED.admin)

    const created = await api()
      .post('/admin/ateliers')
      .set('authorization', bearer(token))
      .send({ slug: 'Atelier-Du-Nord', name: 'Atelier du Nord', city: 'Roubaix', latitude: 50.69, longitude: 3.17 })

    expect(created.status).toBe(201)
    expect(created.body.slug).toBe('atelier-du-nord')
    expect(created.body.status).toBe('DRAFT')

    expect((await api().get('/ateliers/atelier-du-nord')).status).toBe(404)

    const published = await api()
      .patch(`/admin/ateliers/${created.body.id}`)
      .set('authorization', bearer(token))
      .send({ status: 'PUBLISHED' })

    expect(published.status).toBe(200)
    expect((await api().get('/ateliers/atelier-du-nord')).status).toBe(200)
  })

  it('refuses a slug already taken', async () => {
    const token = await harness.signIn(SEED.admin)

    const response = await api()
      .post('/admin/ateliers')
      .set('authorization', bearer(token))
      .send({ slug: 'la-forge-montreuil', name: 'Doublon', city: 'Montreuil', latitude: 48.86, longitude: 2.44 })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('ATELIER_SLUG_TAKEN')
  })

  it('refuses a slug that is not one', async () => {
    const token = await harness.signIn(SEED.admin)

    const response = await api()
      .post('/admin/ateliers')
      .set('authorization', bearer(token))
      .send({ slug: 'Pas Un Slug !', name: 'X', city: 'Paris', latitude: 48.86, longitude: 2.35 })

    expect(response.status).toBe(400)
  })

  it('answers 403 to a member on the admin routes', async () => {
    const token = await harness.signIn(SEED.member)

    expect((await api().get('/admin/ateliers').set('authorization', bearer(token))).status).toBe(403)
  })

  it('answers 401 without a token on the admin routes', async () => {
    expect((await api().get('/admin/ateliers')).status).toBe(401)
  })
})
