export const SESSION_COOKIE = 'etabli_session'

export const PASSWORD_MIN_LENGTH = 8

import { makeFailure, type Failure, type Result } from '@etabli/api-client'
import type { CurrentUser, LoginInput, RegisterInput, Session } from '@etabli/contract'

export type { CurrentUser, LoginInput, RegisterInput, Session }

export const IdentityFailureCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  PREFERRED_ATELIER_NOT_JOINED: 'PREFERRED_ATELIER_NOT_JOINED',
  FORBIDDEN: 'FORBIDDEN',
  USER_UNKNOWN: 'USER_UNKNOWN',
  SELF_LOCKOUT: 'SELF_LOCKOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type IdentityFailureCode = (typeof IdentityFailureCode)[keyof typeof IdentityFailureCode]

export type IdentityFailure = Failure<IdentityFailureCode>

export type IdentityResult<A> = Result<A, IdentityFailureCode>

export interface Account {
  password: string
  user: CurrentUser
}

export const FAILURE_MESSAGES: Readonly<Record<IdentityFailureCode, string>> = {
  INVALID_INPUT: 'Vérifiez les informations saisies.',
  EMAIL_TAKEN: 'Cette adresse a déjà un compte.',
  INVALID_CREDENTIALS: 'Adresse e-mail ou mot de passe incorrect.',
  ACCOUNT_SUSPENDED: 'Ce compte est suspendu.',
  PREFERRED_ATELIER_NOT_JOINED: "Vous n'êtes pas membre de cet atelier.",
  FORBIDDEN: 'Cette page est réservée aux administrateurs de la plateforme.',
  USER_UNKNOWN: 'Ce compte n’existe pas.',
  SELF_LOCKOUT: 'Vous ne pouvez ni retirer votre propre rôle d’administrateur, ni suspendre votre compte.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Le service est momentanément indisponible.',
}

export const failure = makeFailure(FAILURE_MESSAGES)

export interface AuthFormState {
  readonly error: string | null
  readonly email: string
  readonly displayName: string
}

export const emptyAuthFormState: AuthFormState = { error: null, email: '', displayName: '' }

export type AuthFormAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
