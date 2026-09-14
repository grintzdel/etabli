import { AuthContext } from '@etabli/shared/auth-context'
import { IdGeneratorCryptoLive } from '@etabli/shared/id'
import { UserId } from '@etabli/shared/schema'
import { ClockSystemLive } from '@etabli/shared/time'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import { beforeEach, describe, expect, it } from 'vitest'

import { atelierFixture } from '../../../__tests__/atelier.factory'
import { AtelierStatus } from '../../../domain/atelier.constants'
import type { CreateAtelier } from '../../../domain/atelier.schema'
import { Slug } from '../../../domain/atelier.schema'
import { AtelierRepository } from '../../../infrastructure/atelier.repository'
import type { AtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { makeAtelierRepositoryMemory } from '../../../infrastructure/atelier.repository.memory'
import { createAtelier } from './create-atelier.command'

const ADMIN = UserId.make('00000000-0000-4000-8000-0000000000a1')

const payload = (overrides: Partial<CreateAtelier> = {}): CreateAtelier => ({
  slug: Slug.make('la-forge'),
  name: 'La Forge',
  description: 'Un atelier partagé',
  street: '12 rue des Forges',
  postalCode: '93100',
  city: 'Montreuil',
  country: 'FR',
  latitude: 48.8638,
  longitude: 2.4485,
  ...overrides,
})

let repository: AtelierRepositoryMemory

const layerFor = (platformRole: 'MEMBER' | 'PLATFORM_ADMIN') =>
  Layer.mergeAll(
    Layer.succeed(AtelierRepository, repository),
    Layer.succeed(AuthContext, { userId: ADMIN, platformRole, memberships: [] }),
    IdGeneratorCryptoLive,
    ClockSystemLive
  )

const run = (input: CreateAtelier, platformRole: 'MEMBER' | 'PLATFORM_ADMIN' = 'PLATFORM_ADMIN') =>
  Effect.runPromiseExit(createAtelier(input).pipe(Effect.provide(layerFor(platformRole))))

beforeEach(() => {
  repository = makeAtelierRepositoryMemory()
})

describe('createAtelier', () => {
  it('creates the atelier as a draft, invisible to the public directory', async () => {
    const exit = await run(payload())

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(AtelierStatus.DRAFT)
    expect(exit.value.slug).toBe('la-forge')
    expect(exit.value.machineCount).toBe(0)
    expect([...repository.ateliers.values()]).toHaveLength(1)
  })

  it('refuses a plain member', async () => {
    const exit = await run(payload(), 'MEMBER')

    expect(Exit.isFailure(exit)).toBe(true)
    expect([...repository.ateliers.values()]).toHaveLength(0)
  })

  it('refuses a slug another atelier already carries', async () => {
    const existing = atelierFixture({ slug: Slug.make('la-forge') })
    repository.ateliers.set(existing.id, existing)

    const exit = await run(payload())

    expect(Exit.isFailure(exit)).toBe(true)
    expect([...repository.ateliers.values()]).toHaveLength(1)
  })
})
