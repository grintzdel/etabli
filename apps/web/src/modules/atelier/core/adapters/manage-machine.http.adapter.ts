import { createApiClient, type ApiClient, type AuthTokenProvider } from '@etabli/api-client'
import { buildPath, routes } from '@etabli/contract'

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
  private readonly authenticated: ApiClient<AtelierFailureCode>

  constructor(baseUrl: string, getAuthToken: AuthTokenProvider) {
    this.authenticated = createApiClient({
      baseUrl,
      messages: FAILURE_MESSAGES,
      failureOf: manageMachineFailureOf,
      getAuthToken,
      cache: 'no-store',
    })
  }

  listParcs(): Promise<AtelierResult<ReadonlyArray<ManagedParc>>> {
    return this.authenticated.get<ReadonlyArray<ManagedParc>>(routes.manage.machines)
  }

  create(input: CreateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.authenticated.post<ManagedMachine>(routes.manage.machines, input)
  }

  update(id: string, input: UpdateMachineInput): Promise<AtelierResult<ManagedMachine>> {
    return this.authenticated.patch<ManagedMachine>(buildPath(routes.manage.machine, { id }), input)
  }

  regenerateCheckInToken(id: string): Promise<AtelierResult<ManagedMachine>> {
    return this.authenticated.post<ManagedMachine>(buildPath(routes.manage.regenerateMachineToken, { id }))
  }
}
