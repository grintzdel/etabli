import { describe, expect, it } from 'vitest'

import { SessionStoreInMemoryAdapter } from './session-store.in-memory.adapter'

describe('ISessionStorePort', () => {
  it('reads nothing before a token is written', async () => {
    await expect(new SessionStoreInMemoryAdapter().read()).resolves.toBeNull()
  })

  it('reads back what it wrote, and forgets it on clear', async () => {
    const store = new SessionStoreInMemoryAdapter()

    await store.write('jeton')
    await expect(store.read()).resolves.toBe('jeton')

    await store.clear()
    await expect(store.read()).resolves.toBeNull()
  })
})
