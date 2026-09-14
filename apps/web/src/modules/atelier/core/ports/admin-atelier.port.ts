import type { AdminAtelier, AtelierResult, CreateAtelierInput, SetAtelierStatusInput } from '../model/atelier'

export interface IAdminAtelierPort {
  list(token: string): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>>
  create(token: string, input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>>
  setStatus(token: string, id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>>
}
