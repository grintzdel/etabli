import type {
  AdminAtelier,
  AtelierMembership,
  AtelierResult,
  CreateAtelierInput,
  SetAtelierStatusInput,
  SetMembershipRoleInput,
} from '../model/atelier'

export interface IAdminAtelierPort {
  list(): Promise<AtelierResult<ReadonlyArray<AdminAtelier>>>
  create(input: CreateAtelierInput): Promise<AtelierResult<AdminAtelier>>
  setStatus(id: string, input: SetAtelierStatusInput): Promise<AtelierResult<AdminAtelier>>
  setMembershipRole(
    atelierId: string,
    userId: string,
    input: SetMembershipRoleInput
  ): Promise<AtelierResult<AtelierMembership>>
}
