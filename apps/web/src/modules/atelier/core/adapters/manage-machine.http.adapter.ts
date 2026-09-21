import { buildPath, routes } from '@etabli/contract'
import { createApiClient, errorCodeOf, type ApiClient } from '@etabli/shared/http'

import type {
  AtelierFailureCode,
  AtelierResult,
  CreateMachineInput,
  ManagedMachine,
  ManagedParc,
  UpdateMachineInput,
} from '../model/atelier'
import { FAILURE_MESSAGES } from '../model/atelier'
import type { IManageMachinePort } from '../ports/manage-machine.port'

const NFC_TAG_TAKEN = new Set(['MachineNfcTagTakenError', 'MACHINE_NFC_TAG_TAKEN'])

const failureOf = (status: number, body: unknown): AtelierFailureCode => {
  const code = errorCodeOf(body)
  if (code !== undefined && NFC_TAG_TAKEN.has(code)) return 'NFC_TAG_TAKEN'
  if (status === 400) return 'INVALID_FILTER'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'NFC_TAG_TAKEN'
  return 'UNREACHABLE'
}

export class ManageMachineHttpAdapter implements IManageMachinePort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({ baseUrl, messages: FAILURE_MESSAGES, failureOf, cache: 'no-store' })
  }

  listParcs(token: string): Promise<AtelierResult<ReadonlyArray<ManagedParc>>> {
    return this.http.call<ReadonlyArray<ManagedParc>>(routes.manage.machines, { token })
  }

  create(token: string, input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.http.call<ManagedMachine>(routes.manage.machines, { method: 'POST', token, body: input })
  }

  update(token: string, id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.http.call<ManagedMachine>(buildPath(routes.manage.machine, { id }), {
      method: 'PATCH',
      token,
      body: input,
    })
  }
}
