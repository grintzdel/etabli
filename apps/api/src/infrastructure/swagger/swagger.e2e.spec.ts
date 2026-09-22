import { flattenRoutes, routes } from '@etabli/contract'
import { SwaggerModule } from '@nestjs/swagger'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeTestApp, type TestApp } from '../../shared/testing/app.harness.ts'
import { swaggerConfig } from './swagger.ts'

const anonymised = (path: string): string => path.replaceAll(/:[A-Za-z]+|\{[A-Za-z]+\}/g, '{}')

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

  it('serves every path the contract declares, and declares every path it serves', () => {
    const served = new Set(Object.keys(document.paths).map(anonymised))
    const declared = new Set(flattenRoutes(routes).map(([, path]) => anonymised(path)))

    expect([...served].filter((path) => !declared.has(path))).toEqual([])
    expect([...declared].filter((path) => !served.has(path))).toEqual([])
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
