import { AuthContext } from '@etabli/shared/auth-context'
import { IdGenerator, IdGeneratorCryptoLive } from '@etabli/shared/id'
import { AtelierId, UserId } from '@etabli/shared/schema'
import { Clock, ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus } from '../../../domain/atelier.constants'
import type { CompleteOnboarding } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { MemberProfile } from '../../ports/member-profile'
import { completeOnboarding } from './complete-onboarding.command'

const USER = UserId.make('00000000-0000-4000-8000-000000000001')

let repository: AtelierRepositoryMemory
let marked: Array<{ userId: string; practice: ReadonlyArray<string> }>
let TestLayer: Layer.Layer<AtelierRepository | MemberProfile | AuthContext | IdGenerator | Clock>

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
  marked = []

  TestLayer = Layer.mergeAll(
    Layer.succeed(AtelierRepository, repository),
    Layer.succeed(
      MemberProfile,
      MemberProfile.of({
        markOnboarded: (userId, practice) =>
          Effect.sync(() => {
            marked.push({ userId, practice })
          }),
      })
    ),
    Layer.succeed(AuthContext, { userId: USER, platformRole: 'MEMBER', memberships: [] }),
    IdGeneratorCryptoLive,
    ClockSystemLive
  )
})

const run = (payload: CompleteOnboarding) =>
  Effect.runPromiseExit(completeOnboarding(payload).pipe(Effect.provide(TestLayer)))

describe('completeOnboarding', () => {
  it('joins a published atelier as a member and records the practice', async () => {
    const atelier = atelierFixture({ name: 'La Forge' })
    repository.ateliers.set(atelier.id, atelier)

    const exit = await run({ atelierId: atelier.id, practice: ['bois', 'métal'] })
    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return

    expect(exit.value.atelierName).toBe('La Forge')
    expect(exit.value.role).toBe('MEMBER')
    expect([...repository.memberships.values()]).toHaveLength(1)
    expect(marked).toEqual([{ userId: USER, practice: ['bois', 'métal'] }])
  })

  it('is idempotent: onboarding twice leaves a single membership', async () => {
    const atelier = atelierFixture()
    repository.ateliers.set(atelier.id, atelier)

    await run({ atelierId: atelier.id, practice: ['bois'] })
    const second = await run({ atelierId: atelier.id, practice: ['couture'] })

    expect(Exit.isSuccess(second)).toBe(true)
    expect([...repository.memberships.values()]).toHaveLength(1)
    expect(marked.at(-1)?.practice).toEqual(['couture'])
  })

  it('fails on an atelier that does not exist', async () => {
    const exit = await run({
      atelierId: AtelierId.make('00000000-0000-4000-8000-0000000000ff'),
      practice: ['bois'],
    })

    expect(Exit.isFailure(exit)).toBe(true)
    expect([...repository.memberships.values()]).toHaveLength(0)
  })

  it('fails the same way on a draft atelier', async () => {
    const atelier = atelierFixture({ status: AtelierStatus.DRAFT })
    repository.ateliers.set(atelier.id, atelier)

    expect(Exit.isFailure(await run({ atelierId: atelier.id, practice: ['bois'] }))).toBe(true)
  })

  it('leaves the profile untouched when the atelier refuses the membership', async () => {
    await run({ atelierId: AtelierId.make('00000000-0000-4000-8000-0000000000ff'), practice: ['bois'] })
    expect(marked).toEqual([])
  })
})
