import { createApiClient, type ApiClient } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

import { certificationFailureOf } from '../lib/certification-failure'
import type {
  CertificationFailureCode,
  CertificationRequest,
  CertificationResult,
  MyCertification,
} from '../model/certification'
import { FAILURE_MESSAGES } from '../model/certification'
import type { ICertificationPort } from '../ports/certification.port'

export class CertificationHttpAdapter implements ICertificationPort {
  private readonly http: ApiClient<CertificationFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: certificationFailureOf,
      cache: 'no-store',
    })
  }

  private async send(path: string, token: string, body?: unknown): Promise<CertificationResult<void>> {
    const result = await this.http.call<unknown>(path, { method: 'POST', token, body })
    return result.ok ? { ok: true, value: undefined } : result
  }

  mine(token: string): Promise<CertificationResult<ReadonlyArray<MyCertification>>> {
    return this.http.call<ReadonlyArray<MyCertification>>(routes.certifications.mine, { token })
  }

  request(token: string, machineId: string): Promise<CertificationResult<void>> {
    return this.send(routes.certifications.request, token, { machineId })
  }

  queue(token: string): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>> {
    return this.http.call<ReadonlyArray<CertificationRequest>>(routes.manage.certifications, { token })
  }

  grant(token: string, certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.grantCertification, { id: certificationId }), token)
  }

  revoke(token: string, certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.revokeCertification, { id: certificationId }), token)
  }
}
