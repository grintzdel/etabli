import { describe, expect, it } from 'vitest'

import { parseMachineForm } from './machine-form'

const form = (overrides: Readonly<Record<string, string>> = {}, certified = true): FormData => {
  const data = new FormData()
  const values: Readonly<Record<string, string>> = {
    atelierId: '10000000-0000-4000-8000-000000000001',
    name: 'Trotec Speedy',
    description: 'Découpe laser 100 W',
    kind: 'LASER_CUTTER',
    slotDurationMinutes: '60',
    ...overrides,
  }
  for (const [key, value] of Object.entries(values)) data.append(key, value)
  if (certified) data.append('requiresCertification', 'on')
  return data
}

describe('parseMachineForm', () => {
  it('reads a complete form', () => {
    const parsed = parseMachineForm(form())

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.input.name).toBe('Trotec Speedy')
    expect(parsed.input.slotDurationMinutes).toBe(60)
    expect(parsed.input.requiresCertification).toBe(true)
  })

  it('reads an unchecked box as no certification required', () => {
    const parsed = parseMachineForm(form({}, false))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.input.requiresCertification).toBe(false)
  })

  it('refuses a form with no atelier chosen', () => {
    expect(parseMachineForm(form({ atelierId: '' })).ok).toBe(false)
  })

  it('refuses an empty name', () => {
    expect(parseMachineForm(form({ name: ' ' })).ok).toBe(false)
  })

  it('refuses a machine kind it does not know', () => {
    expect(parseMachineForm(form({ kind: 'TELEPORTEUR' })).ok).toBe(false)
  })

  it('refuses a slot outside the allowed range', () => {
    expect(parseMachineForm(form({ slotDurationMinutes: '5' })).ok).toBe(false)
    expect(parseMachineForm(form({ slotDurationMinutes: '600' })).ok).toBe(false)
    expect(parseMachineForm(form({ slotDurationMinutes: '45.5' })).ok).toBe(false)
  })

  it('keeps what was typed when it refuses', () => {
    const parsed = parseMachineForm(form({ name: '' }))

    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.values.kind).toBe('LASER_CUTTER')
  })
})
