import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeTestApp, type TestApp } from '../../shared/testing/app.harness.ts'

describe('GET /health', () => {
  let harness: TestApp

  beforeAll(async () => {
    harness = await makeTestApp()
  })

  afterAll(async () => {
    await harness.close()
  })

  it('answers ok', async () => {
    const response = await request(harness.app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
