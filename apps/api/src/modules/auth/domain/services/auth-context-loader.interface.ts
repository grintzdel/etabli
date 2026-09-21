import type { AuthUser } from '../../../../shared/domain/auth-user.ts'

export interface IAuthContextLoader {
  fromBearerToken(token: string): Promise<AuthUser>
}
