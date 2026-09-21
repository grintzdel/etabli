import { describe, expect, it } from 'vitest'

import { onManualTagRequest, requestManualTag } from './manual-tag-request'

describe('requestManualTag', () => {
  it('resolves to null when no prompt is mounted', async () => {
    await expect(requestManualTag()).resolves.toBeNull()
  })

  it('hands the resolver to the mounted prompt', async () => {
    const stop = onManualTagRequest((resolve) => resolve('04:A2'))

    await expect(requestManualTag()).resolves.toBe('04:A2')

    stop()
    await expect(requestManualTag()).resolves.toBeNull()
  })
})
