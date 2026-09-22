import type { AuthTokenProvider } from '@etabli/api-client'

import type { CertificationRequest, CertificationResult, MyCertification } from '../model/certification'
import { failure, isRequestable } from '../model/certification'
import type { ICertificationPort } from '../ports/certification.port'

export class CertificationInMemoryAdapter implements ICertificationPort {
  private readonly catalog = new Map<string, ReadonlyArray<MyCertification>>()
  private readonly requests = new Map<string, CertificationRequest>()
  private counter = 0

  constructor(
    private readonly getAuthToken: AuthTokenProvider,
    seed: ReadonlyArray<CertificationRequest> = [],
    private readonly fabmanagers: ReadonlyMap<string, ReadonlyArray<string>> = new Map()
  ) {
    for (const request of seed) this.requests.set(request.id, request)
  }

  seedCatalog(token: string, certifications: ReadonlyArray<MyCertification>): void {
    this.catalog.set(token, certifications)
  }

  private async caller(): Promise<string> {
    return (await this.getAuthToken()) ?? ''
  }

  async mine(): Promise<CertificationResult<ReadonlyArray<MyCertification>>> {
    const mine = this.catalog.get(await this.caller())
    if (mine === undefined) return failure('UNAUTHORIZED')
    return { ok: true, value: mine }
  }

  async request(machineId: string): Promise<CertificationResult<void>> {
    const token = await this.caller()
    const mine = this.catalog.get(token)
    if (mine === undefined) return failure('UNAUTHORIZED')

    const target = mine.find((certification) => certification.machineId === machineId)
    if (target === undefined) return failure('NOT_CERTIFIABLE')
    if (!isRequestable(target.status)) return failure('ALREADY_REQUESTED')

    this.counter += 1
    const id = `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`
    const requestedAt = new Date().toISOString()
    this.requests.set(id, {
      id,
      userId: token,
      memberName: token,
      machineId: target.machineId,
      machineName: target.machineName,
      atelierId: target.atelierId,
      atelierName: target.atelierName,
      status: 'PENDING',
      requestedAt,
      decidedAt: null,
    })
    this.catalog.set(
      token,
      mine.map((certification) =>
        certification.machineId === machineId
          ? { ...certification, certificationId: id, status: 'PENDING', requestedAt, decidedAt: null }
          : certification
      )
    )
    return { ok: true, value: undefined }
  }

  async queue(): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>> {
    const owned = this.fabmanagers.get(await this.caller())
    if (owned === undefined) return failure('UNAUTHORIZED')

    return {
      ok: true,
      value: [...this.requests.values()].filter(
        (request) => owned.includes(request.atelierId) && request.status === 'PENDING'
      ),
    }
  }

  grant(certificationId: string): Promise<CertificationResult<void>> {
    return this.decide(certificationId, 'GRANTED')
  }

  revoke(certificationId: string): Promise<CertificationResult<void>> {
    return this.decide(certificationId, 'REVOKED')
  }

  private async decide(certificationId: string, status: 'GRANTED' | 'REVOKED'): Promise<CertificationResult<void>> {
    const owned = this.fabmanagers.get(await this.caller())
    if (owned === undefined) return failure('UNAUTHORIZED')

    const current = this.requests.get(certificationId)
    if (current === undefined || !owned.includes(current.atelierId)) return failure('CERTIFICATION_UNKNOWN')

    this.requests.set(certificationId, { ...current, status, decidedAt: new Date().toISOString() })
    return { ok: true, value: undefined }
  }
}
