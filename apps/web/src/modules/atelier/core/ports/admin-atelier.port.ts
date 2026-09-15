import type {
  AdminAtelier,
  AtelierMembership,
  AtelierResult,
  CreateAtelierInput,
  SetAtelierStatusInput,
  SetMembershipRoleInput,
} from '../model/atelier'

export interface IAdminAtelierPort {
  list(token: string): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>>
  create(token: string, input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>>
  setStatus(token: string, id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>>
  setMembershipRole(
    token: string,
    atelierId: string,
    userId: string,
    input: SetMembershipRoleInput
  ): Promise<AtelierResult<AtelierMembership>>
}
