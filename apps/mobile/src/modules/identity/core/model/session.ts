import type { CurrentUser, LoginInput, Session } from '@etabli/contract'
import { makeFailure, type Failure, type Result } from '@etabli/shared/http'

export type { CurrentUser, LoginInput, Session }

export const IdentityFailureCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type IdentityFailureCode = (typeof IdentityFailureCode)[keyof typeof IdentityFailureCode]

export type IdentityFailure = Failure<IdentityFailureCode>

export type IdentityResult<A> = Result<A, IdentityFailureCode>

export interface Account {
  readonly password: string
  readonly user: CurrentUser
  readonly suspended?: boolean
}

export const FAILURE_MESSAGES: Readonly<Record<IdentityFailureCode, string>> = {
  INVALID_INPUT: 'Vérifiez les informations saisies.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Le service est momentanément indisponible. Vérifiez EXPO_PUBLIC_API_URL.',
}

export const failure = makeFailure(FAILURE_MESSAGES)
