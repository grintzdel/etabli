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
import { listMyCertifications } from './list-my-certifications.query'

const ME = UserId.make('00000000-0000-4000-8000-000000000001')
const SOMEONE_ELSE = UserId.make('00000000-0000-4000-8000-000000000002')
const FORGE = '10000000-0000-4000-8000-000000000001' as AtelierId
const LYON = '10000000-0000-4000-8000-000000000002' as AtelierId

let repository: CertificationRepositoryMemory

const seed = (machine: CertifiableMachine, overrides: Partial<Certification> = {}): Certification => {
  const certification: Certification = {
    id: CertificationId.make(globalThis.crypto.randomUUID()),
    userId: ME,
    machineId: machine.machineId,
    status: CertificationStatus.PENDING,
    requestedAt: DateTime.unsafeFromDate(new Date('2026-01-01T00:00:00Z')),
    decidedAt: null,
    decidedBy: null,
    ...overrides,
  }
  repository.certifications.set(certification.id, certification)
  return certification
}

const run = (machines: ReadonlyArray<CertifiableMachine>, atelierId: AtelierId | null = FORGE) =>
  Effect.runPromiseExit(
    listMyCertifications().pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines,
          auth: { userId: ME, memberships: atelierId === null ? [] : memberships(atelierId, 'MEMBER') },
        })
      )
    )
  )

beforeEach(() => {
  repository = makeCertificationRepositoryMemory()
})

describe('listMyCertifications', () => {
  it('lists a machine never asked for as available to ask', async () => {
    const machine = machineFixture({ atelierId: FORGE, machineName: 'Trotec' })

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.status).toBe('NONE')
    expect(exit.value[0]?.certificationId).toBeNull()
    expect(exit.value[0]?.machineName).toBe('Trotec')
  })

  it('carries the state of a request already made', async () => {
    const machine = machineFixture({ atelierId: FORGE })
    seed(machine, { status: CertificationStatus.GRANTED, decidedAt: DateTime.unsafeFromDate(new Date()) })

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.status).toBe('GRANTED')
    expect(exit.value[0]?.certificationId).not.toBeNull()
  })

  it('leaves out the machines that need no habilitation and the retired ones', async () => {
    const free = machineFixture({ atelierId: FORGE, requiresCertification: false })
    const retired = machineFixture({ atelierId: FORGE, retired: true })

    const exit = await run([free, retired])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('leaves out the ateliers the member has not joined', async () => {
    const elsewhere = machineFixture({ atelierId: LYON })

    const exit = await run([elsewhere], FORGE)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('ignores what another member asked for on the same machine', async () => {
    const machine = machineFixture({ atelierId: FORGE })
    seed(machine, { userId: SOMEONE_ELSE, status: CertificationStatus.GRANTED })

    const exit = await run([machine])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value[0]?.status).toBe('NONE')
  })

  it('answers nothing to an account that joined no atelier', async () => {
    const exit = await run([machineFixture()], null)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value).toEqual([])
  })

  it('sorts by atelier then by machine', async () => {
    const b = machineFixture({ atelierId: FORGE, atelierName: 'La Forge', machineName: 'Zund' })
    const a = machineFixture({ atelierId: FORGE, atelierName: 'La Forge', machineName: 'Atelier bois' })

    const exit = await run([b, a])

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.map((item) => item.machineName)).toEqual(['Atelier bois', 'Zund'])
  })
})
