import type { Transactable } from '../../../../infrastructure/database/database.token.ts'
import type { AuthMembership } from '../../../../shared/domain/auth-user.ts'
import type { MembershipRole } from '../../../../shared/domain/roles.constant.ts'
import type { MemberAtelier, MembershipEntity } from '../entities/membership.entity.ts'

export type NewMembership = MembershipEntity

export interface IMembershipRepository {
  find(userId: string, atelierId: string, tx?: Transactable): Promise<MembershipEntity | null>
  insert(membership: NewMembership, tx?: Transactable): Promise<MembershipEntity>
  listAuthMemberships(userId: string): Promise<ReadonlyArray<AuthMembership>>
  listMemberAteliers(userId: string): Promise<ReadonlyArray<MemberAtelier>>
  updateRole(userId: string, atelierId: string, role: MembershipRole): Promise<MembershipEntity | null>
}
