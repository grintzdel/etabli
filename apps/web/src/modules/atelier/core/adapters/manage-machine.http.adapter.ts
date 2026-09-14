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

const codeOf = (status: number): AtelierFailureCode => {
  if (status === 400) return AtelierFailureCode.INVALID_FILTER
  if (status === 401) return AtelierFailureCode.UNAUTHORIZED
  if (status === 403) return AtelierFailureCode.FORBIDDEN
  if (status === 404) return AtelierFailureCode.NOT_FOUND
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

    if (!response.ok) return failure(codeOf(response.status))

    try {
      return { ok: true, value: (await response.json()) as A }
    } catch {
      return failure(AtelierFailureCode.UNREACHABLE)
    }
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
