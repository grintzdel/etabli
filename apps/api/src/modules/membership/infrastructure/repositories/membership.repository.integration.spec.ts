import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seed } from '../../../../infrastructure/database/seed.ts'
import { MembershipRole, MembershipStatus } from '../../../../shared/domain/roles.constant.ts'
import { makeTestDatabase, type TestDatabase } from '../../../../shared/testing/pglite.harness.ts'
import { SEED } from '../../../../shared/testing/seeded-app.harness.ts'
import { MembershipRepositoryDrizzlePg } from './membership.repository.drizzle-pg.ts'

describe('MembershipRepositoryDrizzlePg', () => {
  let database: TestDatabase
  let repository: MembershipRepositoryDrizzlePg

  beforeAll(async () => {
    database = await makeTestDatabase()
    await seed(database.db)
    repository = new MembershipRepositoryDrizzlePg(database.db)
  })

  afterAll(async () => {
    await database.close()
  })

  it('reads the memberships the guard puts on the request', async () => {
    const memberships = await repository.listAuthMemberships(SEED.user.forgeFabmanager)

    expect(memberships).toEqual([{ atelierId: SEED.atelier.forge, role: MembershipRole.FABMANAGER }])
  })

  it('names the ateliers a member has joined', async () => {
    const ateliers = await repository.listMemberAteliers(SEED.user.member)

    expect(ateliers.map((atelier) => atelier.slug).toSorted()).toEqual([
      'copeaux-et-cie-bastille',
      'la-forge-montreuil',
    ])
  })

  it('answers null on a membership that does not exist', async () => {
    expect(await repository.find(SEED.user.newcomer, SEED.atelier.forge)).toBeNull()
  })

  it('names a fabmanager, and answers null on an atelier the account has not joined', async () => {
    const updated = await repository.updateRole(SEED.user.member, SEED.atelier.forge, MembershipRole.FABMANAGER)

    expect(updated?.role).toBe(MembershipRole.FABMANAGER)
    expect(await repository.updateRole(SEED.user.newcomer, SEED.atelier.lyon, MembershipRole.FABMANAGER)).toBeNull()
  })

  it('inserts a membership and reads it back', async () => {
    const inserted = await repository.insert({
      id: randomUUID(),
      userId: SEED.user.newcomer,
      atelierId: SEED.atelier.lyon,
      role: MembershipRole.MEMBER,
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date('2026-09-15T10:00:00Z'),
    })

    expect((await repository.find(SEED.user.newcomer, SEED.atelier.lyon))?.id).toBe(inserted.id)
  })
})
