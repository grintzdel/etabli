import { describe, expect, it } from 'vitest'

import { findMigrations } from './find-migrations'

describe('findMigrations', () => {
  const files = findMigrations()

  it('finds the shared domain_events migration', () => {
    expect(files.map((file) => file.filename)).toContain('0001_create_domain_events.sql')
  })

  it('returns files sorted by numeric prefix', () => {
    const ids = files.map((file) => file.id)
    expect(ids).toEqual([...ids].toSorted((a, b) => a - b))
  })

  it('parses the id and the name out of the filename', () => {
    const first = files.find((file) => file.filename === '0001_create_domain_events.sql')
    expect(first?.id).toBe(1)
    expect(first?.name).toBe('create_domain_events')
  })

  it('returns absolute, readable paths', () => {
    expect(files.every((file) => file.path.endsWith(file.filename))).toBe(true)
  })
})
