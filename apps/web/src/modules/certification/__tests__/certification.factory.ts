import type { CertificationRequest, MyCertification } from '@/modules/certification/core/model/certification'

let counter = 0

export const myCertificationFixture = (overrides: Partial<MyCertification> = {}): MyCertification => {
  counter += 1
  return {
    certificationId: null,
    machineId: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineName: `Machine ${counter}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: 'La Forge',
    atelierSlug: 'la-forge',
    status: 'NONE',
    requestedAt: null,
    decidedAt: null,
    ...overrides,
  }
}

export const certificationRequestFixture = (overrides: Partial<CertificationRequest> = {}): CertificationRequest => {
  counter += 1
  return {
    id: `60000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    userId: `70000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    memberName: `Camille ${counter}`,
    machineId: `50000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    machineName: `Machine ${counter}`,
    atelierId: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    atelierName: 'La Forge',
    status: 'PENDING',
    requestedAt: '2026-01-01T00:00:00.000Z',
    decidedAt: null,
    ...overrides,
  }
}
