import { SwaggerModule } from '@nestjs/swagger'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeTestApp, type TestApp } from '../../shared/testing/app.harness.ts'
import { swaggerConfig } from './swagger.ts'

describe('the OpenAPI document', () => {
  let harness: TestApp
  let document: ReturnType<typeof SwaggerModule.createDocument>

  beforeAll(async () => {
    harness = await makeTestApp()
    document = SwaggerModule.createDocument(harness.app, swaggerConfig())
  })

  afterAll(async () => {
    await harness.close()
  })

  it('carries the thirty-eight routes of the surface, health included', () => {
    const operations = Object.entries(document.paths).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`)
    )

    expect(operations.toSorted()).toEqual([
      'GET /admin/ateliers',
      'GET /admin/stats',
      'GET /admin/users',
      'GET /ateliers',
      'GET /ateliers/{slug}',
      'GET /auth/me',
      'GET /bookings',
      'GET /bookings/{bookingId}',
      'GET /certifications/mine',
      'GET /health',
      'GET /machines/{machineId}/availability',
      'GET /manage/bookings',
      'GET /manage/certifications',
      'GET /manage/machines',
      'GET /manage/stats',
      'GET /me/ateliers',
      'GET /me/preferences',
      'PATCH /admin/ateliers/{atelierId}',
      'PATCH /admin/ateliers/{atelierId}/members/{userId}',
      'PATCH /admin/users/{userId}',
      'PATCH /manage/machines/{machineId}',
      'PATCH /me/preferences',
      'PATCH /me/profile',
      'POST /admin/ateliers',
      'POST /auth/login',
      'POST /auth/password',
      'POST /auth/register',
      'POST /bookings',
      'POST /bookings/{bookingId}/cancel',
      'POST /bookings/{bookingId}/check-in',
      'POST /certifications/request',
      'POST /manage/bookings/{bookingId}/cancel',
      'POST /manage/bookings/{bookingId}/check-in',
      'POST /manage/bookings/{bookingId}/no-show',
      'POST /manage/certifications/{certificationId}/grant',
      'POST /manage/certifications/{certificationId}/revoke',
      'POST /manage/machines',
      'POST /onboarding/complete',
    ])
  })

  it('describes a response from its Zod schema, fields and enums included', () => {
    const schema = document.paths['/bookings/{bookingId}']?.get?.responses['200']

    expect(schema).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { enum: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
              canCancel: { type: 'boolean' },
            },
          },
        },
      },
    })
  })

  it('describes a collection as an array of its item schema', () => {
    const schema = document.paths['/bookings']?.get?.responses['200']

    expect(schema).toMatchObject({
      content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } },
    })
  })
})
