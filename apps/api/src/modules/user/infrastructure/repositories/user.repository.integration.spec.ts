import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seed } from '../../../../infrastructure/database/seed.ts'
import { makeTestDatabase, type TestDatabase } from '../../../../shared/testing/pglite.harness.ts'
import { SEED } from '../../../../shared/testing/seeded-app.harness.ts'
import { UserRepositoryDrizzlePg } from './user.repository.drizzle-pg.ts'

const AT = new Date('2026-09-15T10:00:00Z')

describe('UserRepositoryDrizzlePg', () => {
  let database: TestDatabase
  let repository: UserRepositoryDrizzlePg

  beforeAll(async () => {
    database = await makeTestDatabase()
    await seed(database.db)
    repository = new UserRepositoryDrizzlePg(database.db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('reads an account by its address', async () => {
    expect((await repository.findByEmail(SEED.member))?.displayName).toBe('Camille Roux')
  })

  it('names the ateliers each account belongs to', async () => {
    const users = await repository.listForAdmin({})
    const member = users.find((user) => user.email === SEED.member)

    expect(member?.ateliers.map((atelier) => atelier.slug).toSorted()).toEqual([
      'copeaux-et-cie-bastille',
      'la-forge-montreuil',
    ])
  })

  it('searches on the address and on the displayed name', async () => {
    expect((await repository.listForAdmin({ search: 'camille' })).map((user) => user.email)).toEqual([SEED.member])
    expect((await repository.listForAdmin({ search: 'fabmanager.forge' })).map((user) => user.email)).toEqual([
      SEED.forgeFabmanager,
    ])
  })

  it('filters on the platform role and on the status', async () => {
    expect((await repository.listForAdmin({ platformRole: 'PLATFORM_ADMIN' })).map((user) => user.email)).toEqual([
      SEED.admin,
    ])
    expect((await repository.listForAdmin({ status: 'SUSPENDED' })).map((user) => user.email)).toEqual([SEED.suspended])
  })

  it('names the accounts it is asked about, and only those', async () => {
    const names = await repository.namesOf([SEED.user.member, SEED.user.member, '00000000-0000-4000-8000-000000000000'])

    expect(names.get(SEED.user.member)).toBe('Camille Roux')
    expect(names.size).toBe(1)
    expect((await repository.namesOf([])).size).toBe(0)
  })

  it('patches the profile without touching the keys left out', async () => {
    const before = await repository.findById(SEED.user.member)
    const updated = await repository.updateProfile(SEED.user.member, { displayName: 'Camille R.' }, AT)

    expect(updated?.displayName).toBe('Camille R.')
    expect(updated?.practice).toEqual(before?.practice)
  })

  it('stores the preferences it is given and defaults the rest', async () => {
    const created = await repository.upsertPreferences(SEED.user.member, { theme: 'dark' }, AT)

    expect(created.theme).toBe('dark')
    expect(created.defaultAtelierId).toBeNull()
  })

  it('leaves a stored key intact when the patch does not carry it', async () => {
    await repository.upsertPreferences(SEED.user.member, { theme: 'dark', defaultAtelierId: SEED.atelier.forge }, AT)
    const patched = await repository.upsertPreferences(SEED.user.member, { theme: 'light' }, AT)

    expect(patched.theme).toBe('light')
    expect(patched.defaultAtelierId).toBe(SEED.atelier.forge)
  })

  it('clears the default atelier on an explicit null', async () => {
    await repository.upsertPreferences(SEED.user.member, { defaultAtelierId: SEED.atelier.forge }, AT)
    const cleared = await repository.upsertPreferences(SEED.user.member, { defaultAtelierId: null }, AT)

    expect(cleared.defaultAtelierId).toBeNull()
  })

  it('marks the onboarding and writes the practices in one go', async () => {
    const updated = await repository.markOnboarded(SEED.user.newcomer, ['bois', 'métal'], AT)

    expect(updated?.onboardingCompletedAt).toStrictEqual(AT)
    expect(updated?.practice).toEqual(['bois', 'métal'])
  })
})
