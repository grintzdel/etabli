import { buildPath, routes } from '@etabli/contract'

import type {
  AtelierResult,
  CreateMachineInput,
  ManagedMachine,
  ManagedParc,
  UpdateMachineInput,
} from '../model/atelier'
import { AtelierFailureCode, failure } from '../model/atelier'
import type { IManageMachinePort } from '../ports/manage-machine.port'

const tagOf = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) return undefined
  const tag = (body as { readonly _tag?: unknown })._tag
  return typeof tag === 'string' ? tag : undefined
}

export const codeOf = (status: number, body: unknown): AtelierFailureCode => {
  if (tagOf(body) === 'MachineNfcTagTakenError') return AtelierFailureCode.NFC_TAG_TAKEN
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  if (status === 401) return AtelierFailureCode.UNAUTHORIZED
  if (status === 403) return AtelierFailureCode.FORBIDDEN
  if (status === 404) return AtelierFailureCode.NOT_FOUND
  if (status === 409) return AtelierFailureCode.NFC_TAG_TAKEN
  return AtelierFailureCode.UNREACHABLE
}

export class ManageMachineHttpAdapter implements IManageMachinePort {
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

    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) return failure(codeOf(response.status, body))
    if (body === null) return failure(AtelierFailureCode.UNREACHABLE)

    return { ok: true, value: body as A }
  }

  listParcs(token: string): Promise<AtelierResult<ReadonlyArray<ManagedParc>>> {
    return this.call<ReadonlyArray<ManagedParc>>(routes.manage.machines, token)
  }

  create(token: string, input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.call<ManagedMachine>(routes.manage.machines, token, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  update(token: string, id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.call<ManagedMachine>(buildPath(routes.manage.machine, { id }), token, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  }
}
