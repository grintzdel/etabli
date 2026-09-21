import type { Result } from '../../../shared/core/http/result'

export interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
}

export const LocationFailureCode = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const
export type LocationFailureCode = (typeof LocationFailureCode)[keyof typeof LocationFailureCode]

export interface LocationFailure {
  readonly code: LocationFailureCode
  readonly message: string
}

export type LocationResult<A> = Result<A, LocationFailure>

export const FAILURE_MESSAGES: Readonly<Record<LocationFailureCode, string>> = {
  PERMISSION_DENIED: 'Sans votre position, l’annuaire n’est pas trié par distance.',
  UNAVAILABLE: 'Votre position n’a pas pu être lue. L’annuaire n’est pas trié par distance.',
}

export const failure = (code: LocationFailureCode): LocationResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})
