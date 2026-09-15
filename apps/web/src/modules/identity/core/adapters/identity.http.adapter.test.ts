import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentityFailureCode } from '@/modules/identity/core/model/session'

import { IdentityHttpAdapter } from './identity.http.adapter'

const BASE = 'http://api.test'
const TOKEN = 'un-jeton'

const USER = { id: 'u1', email: 'camille@etabli.test', displayName: 'Camille R.', practice: ['Bois'] }

let fetchMock: ReturnType<typeof vi.fn>

const stub = (status: number, body: unknown = USER) => {
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
}

beforeEach(() => {
  stub(200)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('IdentityHttpAdapter', () => {
  it('patches the profile on the same resource the session reads', async () => {
    const result = await new IdentityHttpAdapter(BASE).updateProfile(TOKEN, { displayName: 'Camille R.' })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/auth/me`)
    expect(init.method).toBe('PATCH')
    expect((init.headers as Record<string, string>)['authorization']).toBe(`Bearer ${TOKEN}`)
    expect(JSON.parse(init.body as string)).toEqual({ displayName: 'Camille R.' })
    expect(result.ok && result.value.displayName).toBe('Camille R.')
  })

  it('sends only the keys it was given', async () => {
    await new IdentityHttpAdapter(BASE).updateProfile(TOKEN, { practice: ['Métal'] })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ practice: ['Métal'] })
  })

  it('reports a refused payload as invalid input', async () => {
    stub(400, { _tag: 'HttpApiDecodeError' })

    const result = await new IdentityHttpAdapter(BASE).updateProfile(TOKEN, { practice: [] })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.INVALID_INPUT)
  })

  it('reports an expired session on 401', async () => {
    stub(401, {})

    const result = await new IdentityHttpAdapter(BASE).me(TOKEN)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe(IdentityFailureCode.UNAUTHORIZED)
  })
})
