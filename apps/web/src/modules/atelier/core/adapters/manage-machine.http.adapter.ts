import { buildPath, routes } from '@etabli/contract'
import { createApiClient, type ApiClient } from '@etabli/shared/http'

import { manageMachineFailureOf } from '../lib/atelier-failure'
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

export class ManageMachineHttpAdapter implements IManageMachinePort {
  private readonly http: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string) {
    this.http = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: manageMachineFailureOf,
      cache: 'no-store',
    })
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
