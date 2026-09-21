import { makeFailure, type Failure, type Result } from '@etabli/shared/http'

export const NfcFailureCode = {
  UNAVAILABLE: 'UNAVAILABLE',
  CANCELLED: 'CANCELLED',
  UNREADABLE: 'UNREADABLE',
} as const
export type NfcFailureCode = (typeof NfcFailureCode)[keyof typeof NfcFailureCode]

export type NfcFailure = Failure<NfcFailureCode>

export type NfcResult<A> = Result<A, NfcFailureCode>

export const FAILURE_MESSAGES: Readonly<Record<NfcFailureCode, string>> = {
  UNAVAILABLE: 'Ce téléphone ne sait pas lire de tag NFC.',
  CANCELLED: 'Lecture interrompue.',
  UNREADABLE: 'Ce tag n’a pas pu être lu. Approchez à nouveau le téléphone de la machine.',
}

export const failure = makeFailure(FAILURE_MESSAGES)
