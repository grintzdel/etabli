import { makeFailure, type Failure, type Result } from '@etabli/api-client'

export const ScanFailureCode = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  CANCELLED: 'CANCELLED',
  UNREADABLE: 'UNREADABLE',
} as const
export type ScanFailureCode = (typeof ScanFailureCode)[keyof typeof ScanFailureCode]

export type ScanFailure = Failure<ScanFailureCode>

export type ScanResult<A> = Result<A, ScanFailureCode>

export const FAILURE_MESSAGES: Readonly<Record<ScanFailureCode, string>> = {
  PERMISSION_DENIED: 'Sans accès à l’appareil photo, le QR code ne peut pas être scanné.',
  CANCELLED: 'Scan interrompu.',
  UNREADABLE: 'Ce QR code n’a pas pu être lu. Cadrez-le à nouveau.',
}

export const failure = makeFailure(FAILURE_MESSAGES)
