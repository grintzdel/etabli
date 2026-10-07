import { describe, expect, it } from 'vitest'

import { apiBaseUrlFrom } from './api-base-url'

describe('apiBaseUrlFrom', () => {
  it('follows the machine serving the bundle, so a new wifi address needs no edit', () => {
    expect(apiBaseUrlFrom(undefined, '192.168.6.50:8081')).toBe('http://192.168.6.50:3001')
  })

  it('lets an explicit url win over the dev server', () => {
    expect(apiBaseUrlFrom('https://api.etabli.org', '192.168.6.50:8081')).toBe('https://api.etabli.org')
  })

  it('ignores a blank explicit url', () => {
    expect(apiBaseUrlFrom('  ', '192.168.6.50:8081')).toBe('http://192.168.6.50:3001')
  })

  it('accepts a bonjour host name', () => {
    expect(apiBaseUrlFrom(undefined, 'atelier-mac.local:8081')).toBe('http://atelier-mac.local:3001')
  })

  it('falls back on localhost behind a tunnel, whose host is not the machine running the api', () => {
    expect(apiBaseUrlFrom(undefined, 'abc-anonymous-8081.exp.direct')).toBe('http://localhost:3001')
  })

  it('falls back on localhost outside development', () => {
    expect(apiBaseUrlFrom(undefined, undefined)).toBe('http://localhost:3001')
  })
})
