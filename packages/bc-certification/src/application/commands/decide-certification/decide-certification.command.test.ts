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
import { grantCertification, revokeCertification } from './decide-certification.command'

const FABMANAGER = UserId.make('00000000-0000-4000-8000-0000000000f1')
const MEMBER = UserId.make('00000000-0000-4000-8000-000000000001')
const OTHER_ATELIER = '20000000-0000-4000-8000-000000000002' as CertifiableMachine['atelierId']

let repository: CertificationRepositoryMemory

const seed = (machine: CertifiableMachine): Certification => {
  const certification: Certification = {
    id: CertificationId.make(globalThis.crypto.randomUUID()),
    userId: MEMBER,
    machineId: machine.machineId,
    status: CertificationStatus.PENDING,
    requestedAt: DateTime.unsafeFromDate(new Date('2026-01-01T00:00:00Z')),
    decidedAt: null,
    decidedBy: null,
  }
  repository.certifications.set(certification.id, certification)
  return certification
}

type Decision = ReturnType<typeof grantCertification>

const run = (program: Decision, machine: CertifiableMachine, atelierId = machine.atelierId) =>
  Effect.runPromiseExit(
    program.pipe(
      Effect.provide(
        makeTestLayer({
          repository,
          machines: [machine],
          auth: { userId: FABMANAGER, memberships: memberships(atelierId, 'FABMANAGER') },
        })
      )
    )
  )

beforeEach(() => {
  repository = makeCertificationRepositoryMemory()
})

describe('grantCertification', () => {
  it('grants the habilitation and stamps who decided', async () => {
    const machine = machineFixture()
    const certification = seed(machine)

    const exit = await run(grantCertification(certification.id), machine)

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isFailure(exit)) return
    expect(exit.value.status).toBe(CertificationStatus.GRANTED)
    expect(exit.value.decidedBy).toBe(FABMANAGER)
    expect(exit.value.decidedAt).not.toBeNull()
  })

  it('refuses a fabmanager of another atelier, as if the request did not exist', async () => {
    const machine = machineFixture()
    const certification = seed(machine)

    expect(Exit.isFailure(await run(grantCertification(certification.id), machine, OTHER_ATELIER))).toBe(true)
    expect(repository.certifications.get(certification.id)?.status).toBe(CertificationStatus.PENDING)
  })

  it('fails on a certification that does not exist', async () => {
    const machine = machineFixture()
    const exit = await run(grantCertification(CertificationId.make(globalThis.crypto.randomUUID())), machine)

    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe('revokeCertification', () => {
  it('revokes a granted habilitation', async () => {
    const machine = machineFixture()
    const certification = seed(machine)
    await run(grantCertification(certification.id), machine)

    const exit = await run(revokeCertification(certification.id), machine)

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(repository.certifications.get(certification.id)?.status).toBe(CertificationStatus.REVOKED)
  })

  it('refuses a pending request the same way, which is how a fabmanager says no', async () => {
    const machine = machineFixture()
    const certification = seed(machine)

    await run(revokeCertification(certification.id), machine)

    expect(repository.certifications.get(certification.id)?.status).toBe(CertificationStatus.REVOKED)
  })
})
