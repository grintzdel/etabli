import { UserId } from '@etabli/shared/schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { beforeEach, describe, expect, it } from 'vitest'

import { machineFixture, makeTestLayer, memberships } from '../../../__tests__/certification.test-layer'
import { CertificationStatus } from '../../../domain/certification.constants'
import type { CertificationRepositoryMemory } from '../../../infrastructure/certification.repository.memory'
import { makeCertificationRepositoryMemory } from '../../../infrastructure/certification.repository.memory'
import type { CertifiableMachine } from '../../ports/machine-directory'
import { requestCertification } from './request-certification.command'

const MEMBER = UserId.make('00000000-0000-4000-8000-000000000001')

let repository: CertificationRepositoryMemory

const run = (machine: CertifiableMachine, role: 'MEMBER' | 'FABMANAGER' | null = 'MEMBER') =>
  Effect.runPromiseExit(
    requestCertification({ machineId: machine.machineId }).pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [machine],
          auth: {
            userId: MEMBER,
            memberships: role === null ? [] : memberships(machine.atelierId, role),
          },
        })
      )
    )
  )

beforeEach(() => {
  repository = makeCertificationRepositoryMemory()
})

describe('requestCertification', () => {
  it('records the request as pending', async () => {
    const exit = await run(machineFixture())

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(CertificationStatus.PENDING)
    expect(exit.value.decidedBy).toBeNull()
  })

  it('refuses a machine of an atelier the user never joined', async () => {
    expect(Exit.isFailure(await run(machineFixture(), null))).toBe(true)
    expect([...repository.certifications.values()]).toHaveLength(0)
  })

  it('refuses a machine that needs no habilitation', async () => {
    expect(Exit.isFailure(await run(machineFixture({ requiresCertification: false })))).toBe(true)
  })

  it('refuses a retired machine', async () => {
    expect(Exit.isFailure(await run(machineFixture({ retired: true })))).toBe(true)
  })

  it('refuses a second request while the first is still pending', async () => {
    const machine = machineFixture()
    await run(machine)

    expect(Exit.isFailure(await run(machine))).toBe(true)
    expect([...repository.certifications.values()]).toHaveLength(1)
  })

  it('refuses a request on an habilitation already granted', async () => {
    const machine = machineFixture()
    await run(machine)
    const [existing] = [...repository.certifications.values()]
    if (existing === undefined) throw new Error('seed failed')
    repository.certifications.set(existing.id, { ...existing, status: CertificationStatus.GRANTED })

    expect(Exit.isFailure(await run(machine))).toBe(true)
  })

  it('reopens the same request after a revocation instead of creating a second one', async () => {
    const machine = machineFixture()
    await run(machine)
    const [existing] = [...repository.certifications.values()]
    if (existing === undefined) throw new Error('seed failed')
    repository.certifications.set(existing.id, {
      ...existing,
      status: CertificationStatus.REVOKED,
      decidedBy: MEMBER,
    })

    const exit = await run(machine)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.id).toBe(existing.id)
    expect(exit.value.status).toBe(CertificationStatus.PENDING)
    expect(exit.value.decidedBy).toBeNull()
    expect([...repository.certifications.values()]).toHaveLength(1)
  })
})
