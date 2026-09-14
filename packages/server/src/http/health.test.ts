import { HttpApiBuilder, HttpServer } from '@effect/platform'
import { PgLiteSqlClientLayer } from '@etabli/test-utils'
import * as Layer from 'effect/Layer'
import { afterAll, describe, expect, it } from 'vitest'

import { ApiLive } from '../layers/api-live'

const { dispose, handler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(ApiLive, HttpServer.layerContext).pipe(
    Layer.provide(PgLiteSqlClientLayer({ withAllMigrations: true }))
  )
)

afterAll(() => dispose())

describe('GET /health', () => {
  it('answers 200', async () => {
    const response = await handler(new Request('http://localhost/health'))
    expect(response.status).toBe(200)
  })

  it('answers the contract shape', async () => {
    const response = await handler(new Request('http://localhost/health'))
    const body = (await response.json()) as Record<string, unknown>

    expect(body['ok']).toBe(true)
    expect(typeof body['version']).toBe('string')
    expect(typeof body['uptimeMs']).toBe('number')
  })

  it('answers 404 on an unknown path', async () => {
    const response = await handler(new Request('http://localhost/nope'))
    expect(response.status).toBe(404)
  })
})
