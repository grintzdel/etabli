import { buildPath, routes } from '@etabli/contract'

import type { AdminAtelier, AtelierResult, CreateAtelierInput, SetAtelierStatusInput } from '../model/atelier'
import { AtelierFailureCode, failure } from '../model/atelier'
import type { IAdminAtelierPort } from '../ports/admin-atelier.port'

const codeOf = (status: number): AtelierFailureCode => {
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  if (status === 401) return AtelierFailureCode.UNAUTHORIZED
  if (status === 403) return AtelierFailureCode.FORBIDDEN
  if (status === 404) return AtelierFailureCode.NOT_FOUND
  if (status === 409) return AtelierFailureCode.SLUG_TAKEN
  return AtelierFailureCode.UNREACHABLE
}

export class AdminAtelierHttpAdapter implements IAdminAtelierPort {
  constructor(private readonly baseUrl: string) {}

  private async call<A>(path: string, token: string, init?: RequestInit): Promise<AtelierResult<A>> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    } catch {
      return failure(AtelierFailureCode.UNREACHABLE)
    }

    if (!response.ok) return failure(codeOf(response.status))

    try {
      return { ok: true, value: (await response.json()) as A }
    } catch {
      return failure(AtelierFailureCode.UNREACHABLE)
    }
  }

  list(token: string): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>> {
    return this.call<ReadonlyArray<AdminAtelier>>(routes.admin.ateliers, token)
  }

  create(token: string, input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>> {
    return this.call<AdminAtelier>(routes.admin.ateliers, token, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  setStatus(token: string, id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>> {
    return this.call<AdminAtelier>(buildPath(routes.admin.atelier, { id }), token, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }
}
