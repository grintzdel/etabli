import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z, type ZodType } from 'zod'

import { healthResponseSchema } from './infrastructure/health/health.response.dto.ts'
import {
  adminAtelierResponseSchema,
  atelierDetailResponseSchema,
  atelierSummaryResponseSchema,
} from './modules/atelier/presentation/dtos/atelier.response.dto.ts'
import { sessionResponseSchema } from './modules/auth/presentation/dtos/session.response.dto.ts'
import {
  atelierBookingResponseSchema,
  atelierStatsResponseSchema,
  bookingDetailResponseSchema,
  machineAvailabilityResponseSchema,
  networkStatsResponseSchema,
} from './modules/booking/presentation/dtos/booking.response.dto.ts'
import {
  certificationRequestResponseSchema,
  certificationResponseSchema,
  myCertificationResponseSchema,
} from './modules/certification/presentation/dtos/certification.response.dto.ts'
import {
  machineDetailResponseSchema,
  managedParcResponseSchema,
} from './modules/machine/presentation/dtos/machine.response.dto.ts'
import { onboardingResultResponseSchema } from './modules/membership/presentation/dtos/membership.response.dto.ts'
import {
  adminUserResponseSchema,
  currentUserResponseSchema,
  memberAtelierResponseSchema,
  userPreferencesResponseSchema,
} from './modules/user/presentation/dtos/user.response.dto.ts'
import { bearer, makeSeededApp, SEED, type SeededApp } from './shared/testing/seeded-app.harness.ts'

const nonEmptyArray = (schema: ZodType) => z.array(schema).min(1)

const expectShape = (schema: ZodType, body: unknown): void => {
  const parsed = schema.parse(body)
  expect(parsed).toEqual(body)
}

describe('every route answers what its schema says', () => {
  let harness: SeededApp
  let member: string
  let admin: string
  let copeaux: string
  let forge: string
  let bookingId: string

  beforeAll(async () => {
    harness = await makeSeededApp()
    const api = request(harness.app.getHttpServer())

    member = await harness.signIn(SEED.member)
    admin = await harness.signIn(SEED.admin)
    copeaux = await harness.signIn(SEED.copeauxFabmanager)
    forge = await harness.signIn(SEED.forgeFabmanager)

    const booking = await api
      .post('/bookings')
      .set('authorization', bearer(member))
      .send({ machineId: SEED.machine.copeauxBambu, startAt: '2026-09-16T06:00:00.000Z' })
    bookingId = booking.body.id

    await api
      .post('/certifications/request')
      .set('authorization', bearer(member))
      .send({ machineId: SEED.machine.forgeLaser })

    harness.clock.set('2026-09-16T06:00:00.000Z')
  })

  afterAll(async () => {
    await harness.close()
  })

  const api = () => request(harness.app.getHttpServer())

  it.each([
    ['GET /health', () => api().get('/health'), healthResponseSchema, 'none'],
    ['GET /ateliers', () => api().get('/ateliers'), nonEmptyArray(atelierSummaryResponseSchema), 'none'],
    ['GET /ateliers/:slug', () => api().get('/ateliers/la-forge-montreuil'), atelierDetailResponseSchema, 'none'],
    ['GET /auth/me', () => api().get('/auth/me'), currentUserResponseSchema, 'member'],
    ['GET /me/preferences', () => api().get('/me/preferences'), userPreferencesResponseSchema, 'member'],
    ['GET /me/ateliers', () => api().get('/me/ateliers'), nonEmptyArray(memberAtelierResponseSchema), 'member'],
    [
      'PATCH /me/profile',
      () => api().patch('/me/profile').send({ displayName: 'Camille R.' }),
      currentUserResponseSchema,
      'member',
    ],
    ['GET /bookings', () => api().get('/bookings'), nonEmptyArray(bookingDetailResponseSchema), 'member'],
    [
      'GET /machines/:id',
      () => api().get(`/machines/${SEED.machine.copeauxBambu}`),
      machineDetailResponseSchema,
      'none',
    ],
    [
      'GET /machines/:id/availability',
      () => api().get(`/machines/${SEED.machine.copeauxBambu}/availability`),
      machineAvailabilityResponseSchema,
      'member',
    ],
    [
      'GET /certifications/mine',
      () => api().get('/certifications/mine'),
      nonEmptyArray(myCertificationResponseSchema),
      'member',
    ],
    ['GET /manage/machines', () => api().get('/manage/machines'), nonEmptyArray(managedParcResponseSchema), 'forge'],
    [
      'GET /manage/certifications',
      () => api().get('/manage/certifications'),
      nonEmptyArray(certificationRequestResponseSchema),
      'forge',
    ],
    [
      'GET /manage/bookings',
      () => api().get('/manage/bookings'),
      nonEmptyArray(atelierBookingResponseSchema),
      'copeaux',
    ],
    ['GET /manage/stats', () => api().get('/manage/stats'), nonEmptyArray(atelierStatsResponseSchema), 'copeaux'],
    ['GET /admin/users', () => api().get('/admin/users'), nonEmptyArray(adminUserResponseSchema), 'admin'],
    ['GET /admin/ateliers', () => api().get('/admin/ateliers'), nonEmptyArray(adminAtelierResponseSchema), 'admin'],
    ['GET /admin/stats', () => api().get('/admin/stats'), networkStatsResponseSchema, 'admin'],
  ])('%s', async (_route, call, schema, who) => {
    const tokens: Record<string, string | undefined> = { member, admin, copeaux, forge }
    const token = tokens[who]
    const response = token === undefined ? await call() : await call().set('authorization', bearer(token))

    expect(response.status).toBe(200)
    expectShape(schema, response.body)
  })

  it('POST /auth/login', async () => {
    const response = await api().post('/auth/login').send({ email: SEED.member, password: SEED.password })

    expect(response.status).toBe(200)
    expectShape(sessionResponseSchema, response.body)
  })

  it('GET /bookings/:id', async () => {
    const response = await api().get(`/bookings/${bookingId}`).set('authorization', bearer(member))

    expect(response.status).toBe(200)
    expectShape(bookingDetailResponseSchema, response.body)
  })

  it('POST /certifications/request', async () => {
    const newcomer = await harness.signIn(SEED.newcomer)
    await api()
      .post('/onboarding/complete')
      .set('authorization', bearer(newcomer))
      .send({ atelierId: SEED.atelier.forge, practice: ['bois'] })

    const joined = await harness.signIn(SEED.newcomer)
    const response = await api()
      .post('/certifications/request')
      .set('authorization', bearer(joined))
      .send({ machineId: SEED.machine.forgeLaser })

    expect(response.status).toBe(201)
    expectShape(certificationResponseSchema, response.body)
  })

  it('POST /onboarding/complete', async () => {
    const token = await harness.signIn(SEED.lyonFabmanager)

    const response = await api()
      .post('/onboarding/complete')
      .set('authorization', bearer(token))
      .send({ atelierId: SEED.atelier.copeaux, practice: ['textile'] })

    expect(response.status).toBe(201)
    expectShape(onboardingResultResponseSchema, response.body)
  })
})
