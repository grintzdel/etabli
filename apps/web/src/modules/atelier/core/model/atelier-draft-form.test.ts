import { describe, expect, it } from 'vitest'

import { parseAtelierDraft } from './atelier-draft-form'

const form = (overrides: Readonly<Record<string, string>> = {}): FormData => {
  const data = new FormData()
  const values: Readonly<Record<string, string>> = {
    slug: 'la-forge',
    name: 'La Forge',
    description: 'Un atelier partagé',
    street: '12 rue des Forges',
    postalCode: '93100',
    city: 'Montreuil',
    latitude: '48.8638',
    longitude: '2.4485',
    ...overrides,
  }
  for (const [key, value] of Object.entries(values)) data.append(key, value)
  return data
}

describe('parseAtelierDraft', () => {
  it('reads a complete form', () => {
    const parsed = parseAtelierDraft(form())

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.input.slug).toBe('la-forge')
    expect(parsed.input.latitude).toBe(48.8638)
  })

  it('lowercases the slug the admin typed in capitals', () => {
    const parsed = parseAtelierDraft(form({ slug: 'La-Forge' }))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.input.slug).toBe('la-forge')
  })

  it('refuses a slug with spaces and keeps what was typed', () => {
    const parsed = parseAtelierDraft(form({ slug: 'la forge' }))

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.values.name).toBe('La Forge')
  })

  it('refuses an empty name', () => {
    expect(parseAtelierDraft(form({ name: '  ' })).ok).toBe(false)
  })

  it('refuses an empty city', () => {
    expect(parseAtelierDraft(form({ city: '' })).ok).toBe(false)
  })

  it('refuses coordinates outside the world', () => {
    expect(parseAtelierDraft(form({ latitude: '91' })).ok).toBe(false)
    expect(parseAtelierDraft(form({ longitude: 'nord' })).ok).toBe(false)
  })
})
