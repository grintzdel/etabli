import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { routes } from '@etabli/contract'

import { certificationFailureOf } from '../lib/certification-failure'
import {
  FAILURE_MESSAGES,
  type CertificationFailureCode,
  type CertificationResult,
  type MyCertification,
} from '../model/certification'
import type { ICertificationPort } from '../ports/certification.port'

export class CertificationHttpAdapter implements ICertificationPort {
  private readonly authenticated: ApiClient<CertificationFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: certificationFailureOf,
      getAuthToken,
    })
  }

  mine(): Promise<CertificationResult<ReadonlyArray<MyCertification>>> {
    return this.authenticated.get<ReadonlyArray<MyCertification>>(routes.certifications.mine)
  }

  async request(machineId: string): Promise<CertificationResult<void>> {
    const result = await this.authenticated.post<unknown>(routes.certifications.request, { machineId })
    return result.ok ? { ok: true, value: undefined } : result
  }
}
