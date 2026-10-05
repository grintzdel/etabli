import { makeFailure, type Failure, type Result } from '@etabli/api-client'
import type { CurrentUser, LoginInput, MemberAtelier, RegisterInput, Session } from '@etabli/contract'

export type { CurrentUser, LoginInput, MemberAtelier, RegisterInput, Session }

export const IdentityFailureCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
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
  EMAIL_TAKEN: 'Cette adresse a déjà un compte.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Le service est momentanément indisponible. Vérifiez EXPO_PUBLIC_API_URL.',
}

export const failure = makeFailure(FAILURE_MESSAGES)
