import { UnauthorizedException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import { authUserFixture } from '../testing/fixtures.ts'
import { AsyncLocalAuthContext } from './async-local.auth-context.ts'

const tick = () => new Promise((resolve) => setImmediate(resolve))
const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('AsyncLocalAuthContext', () => {
  it('hands back the user the scope was opened with', () => {
    const context = new AsyncLocalAuthContext()
    const user = authUserFixture()

    expect(context.runWith(user, () => context.user)).toBe(user)
  })

  it('refuses to invent a user outside any scope', () => {
    const context = new AsyncLocalAuthContext()

    expect(() => context.user).toThrow(UnauthorizedException)
  })

  it('still knows the user after the call stack has been awaited away', async () => {
    const context = new AsyncLocalAuthContext()
    const user = authUserFixture()

    const seen = await context.runWith(user, async () => {
      await tick()
      await tick()
      return context.user
    })

    expect(seen).toBe(user)
  })

  it('keeps two interleaved requests from reading each other’s user', async () => {
    const context = new AsyncLocalAuthContext()
    const alice = authUserFixture()
    const bob = authUserFixture()

    const readAfter = (user: typeof alice, ms: number) =>
      context.runWith(user, async () => {
        await after(ms)
        return context.user
      })

    const [seenByAlice, seenByBob] = await Promise.all([readAfter(alice, 30), readAfter(bob, 5)])

    expect(seenByAlice).toBe(alice)
    expect(seenByBob).toBe(bob)
  })
})
