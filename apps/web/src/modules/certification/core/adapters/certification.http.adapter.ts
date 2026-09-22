import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
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
  private readonly authenticated: ApiClient<CertificationFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: certificationFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  private async send(path: string, body?: unknown): Promise<CertificationResult<void>> {
    const result = await this.authenticated.post<unknown>(path, body)
    return result.ok ? { ok: true, value: undefined } : result
  }

  mine(): Promise<CertificationResult<ReadonlyArray<MyCertification>>> {
    return this.authenticated.get<ReadonlyArray<MyCertification>>(routes.certifications.mine)
  }

  request(machineId: string): Promise<CertificationResult<void>> {
    return this.send(routes.certifications.request, { machineId })
  }

  queue(): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>> {
    return this.authenticated.get<ReadonlyArray<CertificationRequest>>(routes.manage.certifications)
  }

  grant(certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.grantCertification, { id: certificationId }))
  }

  revoke(certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.revokeCertification, { id: certificationId }))
  }
}
