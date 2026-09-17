import type { CurrentUser, LoginInput, Session } from '@etabli/contract'

import type { Result } from '../../../shared/core/http/result'

export type { CurrentUser, LoginInput, Session }

export const IdentityFailureCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type IdentityFailureCode = (typeof IdentityFailureCode)[keyof typeof IdentityFailureCode]

export interface IdentityFailure {
  readonly code: IdentityFailureCode
  readonly message: string
}

export type IdentityResult<A> = Result<A, IdentityFailure>

export const FAILURE_MESSAGES: Readonly<Record<IdentityFailureCode, string>> = {
  INVALID_INPUT: 'Vérifiez les informations saisies.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Le service est momentanément indisponible. Vérifiez EXPO_PUBLIC_API_URL.',
}

export const failure = (code: IdentityFailureCode): IdentityResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})
