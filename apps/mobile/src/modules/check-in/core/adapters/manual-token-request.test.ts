import { describe, expect, it } from 'vitest'

import { onManualTokenRequest, requestManualToken } from './manual-token-request'

describe('requestManualToken', () => {
  it('resolves to null when no prompt is mounted', async () => {
    await expect(requestManualToken()).resolves.toBeNull()
  })

  it('hands the resolver to the mounted prompt', async () => {
    const stop = onManualTokenRequest((resolve) => resolve('qr-forge-laser-01'))

    await expect(requestManualToken()).resolves.toBe('qr-forge-laser-01')

    stop()
    await expect(requestManualToken()).resolves.toBeNull()
  })
})
