import type { Result } from '../../../shared/core/http/result'

export const NfcFailureCode = {
  UNAVAILABLE: 'UNAVAILABLE',
  CANCELLED: 'CANCELLED',
  UNREADABLE: 'UNREADABLE',
} as const
export type NfcFailureCode = (typeof NfcFailureCode)[keyof typeof NfcFailureCode]

export interface NfcFailure {
  readonly code: NfcFailureCode
  readonly message: string
}

export type NfcResult<A> = Result<A, NfcFailure>

export const FAILURE_MESSAGES: Readonly<Record<NfcFailureCode, string>> = {
  UNAVAILABLE: 'Ce téléphone ne sait pas lire de tag NFC.',
  CANCELLED: 'Lecture interrompue.',
  UNREADABLE: 'Ce tag n’a pas pu être lu. Approchez à nouveau le téléphone de la machine.',
}

export const failure = (code: NfcFailureCode): NfcResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})
