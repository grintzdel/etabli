import type { AtelierId } from '@etabli/shared/schema'
import { CertificationId, UserId } from '@etabli/shared/schema'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { beforeEach, describe, expect, it } from 'vitest'

import { machineFixture, makeTestLayer, memberships } from '../../../__tests__/certification.test-layer'
import { CertificationStatus } from '../../../domain/certification.constants'
import type { Certification } from '../../../domain/certification.schema'
import type { CertificationRepositoryMemory } from '../../../infrastructure/certification.repository.memory'
import { makeCertificationRepositoryMemory } from '../../../infrastructure/certification.repository.memory'
import type { CertifiableMachine } from '../../ports/machine-directory'
import { listCertificationRequests } from './list-certification-requests.query'

const FABMANAGER = UserId.make('00000000-0000-4000-8000-0000000000f1')
const CAMILLE = UserId.make('00000000-0000-4000-8000-000000000001')
const FORGE = '10000000-0000-4000-8000-000000000001' as AtelierId
const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId

let repository: CertificationRepositoryMemory

const seed = (
  machine: CertifiableMachine,
  overrides: Partial<Certification> = {},
  at = '2026-01-01T00:00:00Z'
): Certification => {
  const certification: Certification = {
    id: CertificationId.make(globalThis.crypto.randomUUID()),
    userId: CAMILLE,
    machineId: machine.machineId,
    status: CertificationStatus.PENDING,
    requestedAt: DateTime.unsafeFromDate(new Date(at)),
    decidedAt: null,
    decidedBy: null,
    ...overrides,
  }
  repository.certifications.set(certification.id, certification)
  return certification
}

const run = (machines: ReadonlyArray<CertifiableMachine>, atelierId: AtelierId = FORGE, role = 'FABMANAGER' as const) =>
  Effect.runPromiseExit(
    listCertificationRequests().pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines,
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, role) },
          names: new Map([[CAMILLE, 'Camille Roux']]),
        })
      )
    )
  )

beforeEach(() => {
  repository = makeCertificationRepositoryMemory()
})

describe('listCertificationRequests', () => {
  it('names who asks for what', async () => {
    const machine = machineFixture({ atelierId: FORGE, machineName: 'Trotec' })
    seed(machine)

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.memberName).toBe('Camille Roux')
    expect(exit.value[0]?.machineName).toBe('Trotec')
  })

  it('puts the pending requests first, oldest first inside each state', async () => {
    const machine = machineFixture({ atelierId: FORGE })
    seed(machine, { status: CertificationStatus.GRANTED })
    seed(machine, { userId: UserId.make('00000000-0000-4000-8000-000000000009') }, '2026-03-01T00:00:00Z')
    seed(machine, { userId: UserId.make('00000000-0000-4000-8000-00000000000a') }, '2026-02-01T00:00:00Z')

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.map((item) => item.status)).toEqual(['PENDING', 'PENDING', 'GRANTED'])
    expect(exit.value[0]?.requestedAt.epochMillis).toBeLessThan(exit.value[1]?.requestedAt.epochMillis ?? 0)
  })

  it('answers nothing to a plain member', async () => {
    const machine = machineFixture({ atelierId: FORGE })
    seed(machine)

    const exit = await run([machine], FORGE, 'MEMBER' as 'FABMANAGER')

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('keeps out the requests of an atelier the user does not run', async () => {
    const elsewhere = machineFixture({ atelierId: LYON })
    seed(elsewhere)

    const exit = await run([elsewhere], FORGE)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('says so rather than inventing a name when the account is gone', async () => {
    const machine = machineFixture({ atelierId: FORGE })
    seed(machine, { userId: UserId.make('00000000-0000-4000-8000-0000000000dd') })

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.memberName).toBe('Compte supprimé')
  })
})
