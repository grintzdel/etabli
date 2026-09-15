import type { CurrentUser } from '../../../user/domain/entities/user.entity.ts'

export interface Session {
  readonly token: string
  readonly expiresAt: Date
  readonly user: CurrentUser
}
