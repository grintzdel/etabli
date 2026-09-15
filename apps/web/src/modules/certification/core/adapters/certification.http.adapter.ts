import { buildPath, routes } from '@etabli/contract'

import type { CertificationRequest, CertificationResult, MyCertification } from '../model/certification'
import { CertificationFailureCode, failure } from '../model/certification'
import type { ICertificationPort } from '../ports/certification.port'

const tagOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const tag = (body as { readonly _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : undefined
}

export const codeOf = (status: number, body: unknown): CertificationFailureCode => {
  if (tagOf(body) === 'CertificationUnknownError') return CertificationFailureCode.CERTIFICATION_UNKNOWN
  if (status === 401) return CertificationFailureCode.UNAUTHORIZED
  if (status === 404) return CertificationFailureCode.NOT_CERTIFIABLE
  if (status === 409) return CertificationFailureCode.ALREADY_REQUESTED
  return CertificationFailureCode.UNREACHABLE
}

export class CertificationHttpAdapter implements ICertificationPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string, token: string, init?: RequestInit): Promise<CertificationResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    } catch {
      return failure(CertificationFailureCode.UNREACHABLE)
    }

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) return failure(codeOf(response.status, body))
    if (body === null) return failure(CertificationFailureCode.UNREACHABLE)

    return { ok: true, value: body as A }
  }

  private async send(path: string, token: string): Promise<CertificationResult<void>> {
    const result = await this.call<unknown>(path, token, { method: 'POST' })
    return result.ok ? { ok: true, value: undefined } : result
  }

  mine(token: string): Promise<CertificationResult<ReadonlyArray<MyCertification>>> {
    return this.call<ReadonlyArray<MyCertification>>(routes.certifications.mine, token)
  }

  async request(token: string, machineId: string): Promise<CertificationResult<void>> {
    const result = await this.call<unknown>(routes.certifications.request, token, {
      method: 'POST',
      body: JSON.stringify({ machineId }),
    })
    return result.ok ? { ok: true, value: undefined } : result
  }

  queue(token: string): Promise<CertificationResult<ReadonlyArray<CertificationRequest>>> {
    return this.call<ReadonlyArray<CertificationRequest>>(routes.manage.certifications, token)
  }

  grant(token: string, certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.grantCertification, { id: certificationId }), token)
  }

  revoke(token: string, certificationId: string): Promise<CertificationResult<void>> {
    return this.send(buildPath(routes.manage.revokeCertification, { id: certificationId }), token)
  }
}
