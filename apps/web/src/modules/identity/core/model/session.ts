export const SESSION_COOKIE = 'etabli_session'

import type { CurrentUser, LoginInput, RegisterInput, Session } from '@etabli/contract'

export type { CurrentUser, LoginInput, RegisterInput, Session }

export const IdentityFailureCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
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

export type IdentityResult<A> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: IdentityFailure }

export const FAILURE_MESSAGES: Readonly<Record<IdentityFailureCode, string>> = {
  INVALID_INPUT: 'Vérifiez les informations saisies.',
  EMAIL_TAKEN: 'Cette adresse a déjà un compte.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Le service est momentanément indisponible.',
}

export const failure = (code: IdentityFailureCode): IdentityResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})

export interface AuthFormState {
  readonly error: string | null
  readonly email: string
  readonly displayName: string
}

export const emptyAuthFormState: AuthFormState = { error: null, email: '', displayName: '' }

export type AuthFormAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
