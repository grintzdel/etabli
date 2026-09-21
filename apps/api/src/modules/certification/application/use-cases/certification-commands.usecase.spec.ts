import { describe, expect, it, vi } from 'vitest'

import { FixedClock } from '../../../../shared/testing/fixed.clock.ts'
import { authUserFixture, fabmanagerOf, machineFixture, memberOf } from '../../../../shared/testing/fixtures.ts'
import { stub } from '../../../../shared/testing/stub.ts'
import type { IMachineRepository } from '../../../machine/domain/repositories/machine.repository.interface.ts'
import { CertificationStatus } from '../../domain/constants/certification.constant.ts'
import type { CertificationEntity } from '../../domain/entities/certification.entity.ts'
import {
  CertificationAlreadyRequestedError,
  CertificationUnknownError,
  MachineNotCertifiableError,
} from '../../domain/errors/certification.errors.ts'
import type { ICertificationRepository } from '../../domain/repositories/certification.repository.interface.ts'
import { GrantCertificationUsecase } from './grant-certification.usecase.ts'
import { RequestCertificationUsecase } from './request-certification.usecase.ts'

const CLOCK = new FixedClock('2026-09-15T10:00:00Z')
const MACHINE = machineFixture()

const certification = (overrides: Partial<CertificationEntity> = {}): CertificationEntity => ({
  id: 'certification-1',
  userId: 'user-1',
  machineId: MACHINE.id,
  status: CertificationStatus.PENDING,
  requestedAt: CLOCK.now(),
  decidedAt: null,
  decidedBy: null,
  ...overrides,
})

const requestUsecase = (options: {
  machine?: typeof MACHINE | null
  existing?: CertificationEntity | null
  insert?: ReturnType<typeof vi.fn>
  reopen?: ReturnType<typeof vi.fn>
}) =>
  new RequestCertificationUsecase(
    stub<ICertificationRepository>({
      findForUserAndMachine: vi.fn().mockResolvedValue(options.existing ?? null),
      insert: options.insert ?? vi.fn(async (input) => certification({ ...input })),
      reopen: options.reopen ?? vi.fn(async () => certification()),
    }),
    stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue(options.machine ?? null) }),
    CLOCK
  )

describe('RequestCertificationUsecase', () => {
  const member = authUserFixture({ memberships: [memberOf(MACHINE.atelierId)] })

  it('opens a pending request on a machine of the member’s atelier', async () => {
    const created = await requestUsecase({ machine: MACHINE }).execute(member, { machineId: MACHINE.id })

    expect(created.status).toBe(CertificationStatus.PENDING)
  })

  it('answers 404 on a machine of an atelier the member has not joined', async () => {
    await expect(
      requestUsecase({ machine: MACHINE }).execute(authUserFixture(), { machineId: MACHINE.id })
    ).rejects.toThrow(MachineNotCertifiableError)
  })

  it('answers 404 on a machine that asks for no certification', async () => {
    await expect(
      requestUsecase({
        machine: machineFixture({ requiresCertification: false, atelierId: MACHINE.atelierId }),
      }).execute(member, { machineId: MACHINE.id })
    ).rejects.toThrow(MachineNotCertifiableError)
  })

  it('answers 404 on a retired machine', async () => {
    await expect(
      requestUsecase({ machine: machineFixture({ status: 'RETIRED', atelierId: MACHINE.atelierId }) }).execute(member, {
        machineId: MACHINE.id,
      })
    ).rejects.toThrow(MachineNotCertifiableError)
  })

  it('refuses a second request while one is pending', async () => {
    await expect(
      requestUsecase({ machine: MACHINE, existing: certification() }).execute(member, { machineId: MACHINE.id })
    ).rejects.toThrow(CertificationAlreadyRequestedError)
  })

  it('refuses a request on an already granted certification', async () => {
    await expect(
      requestUsecase({ machine: MACHINE, existing: certification({ status: CertificationStatus.GRANTED }) }).execute(
        member,
        { machineId: MACHINE.id }
      )
    ).rejects.toThrow(CertificationAlreadyRequestedError)
  })

  it('reopens a revoked certification instead of refusing it', async () => {
    const reopen = vi.fn(async () => certification())
    const reopened = await requestUsecase({
      machine: MACHINE,
      existing: certification({ status: CertificationStatus.REVOKED }),
      reopen,
    }).execute(member, { machineId: MACHINE.id })

    expect(reopen).toHaveBeenCalledWith('certification-1', CLOCK.now())
    expect(reopened.status).toBe(CertificationStatus.PENDING)
  })
})

describe('GrantCertificationUsecase', () => {
  const grantUsecase = (machine: typeof MACHINE | null, existing: CertificationEntity | null) =>
    new GrantCertificationUsecase(
      stub<ICertificationRepository>({
        findById: vi.fn().mockResolvedValue(existing),
        decide: vi.fn(async (_id, status) => certification({ status, decidedBy: 'fabmanager-1' })),
      }),
      stub<IMachineRepository>({ findById: vi.fn().mockResolvedValue(machine) }),
      CLOCK
    )

  it('grants a request on a machine of the fabmanager’s atelier', async () => {
    const fabmanager = authUserFixture({ id: 'fabmanager-1', memberships: [fabmanagerOf(MACHINE.atelierId)] })
    const decided = await grantUsecase(MACHINE, certification()).execute(fabmanager, 'certification-1')

    expect(decided.status).toBe(CertificationStatus.GRANTED)
  })

  it('answers 404 to a fabmanager of another atelier', async () => {
    const stranger = authUserFixture({ memberships: [fabmanagerOf('another-atelier')] })

    await expect(grantUsecase(MACHINE, certification()).execute(stranger, 'certification-1')).rejects.toThrow(
      CertificationUnknownError
    )
  })

  it('answers 404 on a request that does not exist', async () => {
    const fabmanager = authUserFixture({ memberships: [fabmanagerOf(MACHINE.atelierId)] })

    await expect(grantUsecase(MACHINE, null).execute(fabmanager, 'ghost')).rejects.toThrow(CertificationUnknownError)
  })
})
