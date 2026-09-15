import type { MembershipRole, MembershipStatus } from '../../../../shared/domain/roles.constant.ts'
import type { MemberAtelier } from '../../../user/domain/entities/user.entity.ts'

export type { MemberAtelier }

export interface MembershipEntity {
  readonly id: string
  readonly userId: string
  readonly atelierId: string
  readonly role: MembershipRole
  readonly status: MembershipStatus
  readonly joinedAt: Date
}

export interface OnboardingResult {
  readonly atelierId: string
  readonly atelierSlug: string
  readonly atelierName: string
  readonly role: MembershipRole
  readonly practice: ReadonlyArray<string>
  readonly joinedAt: Date
}
