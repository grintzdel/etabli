import { describe, expect, it } from 'vitest'

import { failure, LocationFailureCode } from '../model/location'
import { LocationInMemoryAdapter } from './location.in-memory.adapter'

describe('ILocationPort', () => {
  it('hands back a point when the permission was granted', async () => {
    const point = { latitude: 48.8566, longitude: 2.3522 }

    await expect(new LocationInMemoryAdapter({ ok: true, value: point }).current()).resolves.toEqual({
      ok: true,
      value: point,
    })
  })

  it('refuses without raising when the permission was denied', async () => {
    const result = await new LocationInMemoryAdapter(failure(LocationFailureCode.PERMISSION_DENIED)).current()

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(LocationFailureCode.PERMISSION_DENIED)
  })
})
