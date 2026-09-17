import { createContext, use } from 'react'

import type { CurrentUser, IdentityResult, LoginInput, Session } from '../../core/model/session'

export type SessionState =
  | { readonly status: 'loading' }
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly token: string; readonly user: CurrentUser }

export interface SessionApi {
  readonly state: SessionState
  readonly token: string | null
  readonly user: CurrentUser | null
  signIn(input: LoginInput): Promise<IdentityResult<Session>>
  signOut(): void
}

export const SessionContext = createContext<SessionApi | null>(null)

export const useSession = (): SessionApi => {
  const api = use(SessionContext)
  if (api === null) throw new Error('useSession must be used inside a SessionProvider')
  return api
}
