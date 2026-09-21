import { makeFailure, type Failure, type Result } from '@etabli/shared/http'

export interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
}

export const LocationFailureCode = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const
export type LocationFailureCode = (typeof LocationFailureCode)[keyof typeof LocationFailureCode]

export type LocationFailure = Failure<LocationFailureCode>

export type LocationResult<A> = Result<A, LocationFailureCode>

export const FAILURE_MESSAGES: Readonly<Record<LocationFailureCode, string>> = {
  PERMISSION_DENIED: 'Sans votre position, l’annuaire n’est pas trié par distance.',
  UNAVAILABLE: 'Votre position n’a pas pu être lue. L’annuaire n’est pas trié par distance.',
}

export const failure = makeFailure(FAILURE_MESSAGES)
