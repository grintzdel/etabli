import type {
  CertificationRequest,
  CertificationStatus,
  MyCertification,
  MyCertificationStatus,
} from '@etabli/contract'

export type { CertificationRequest, CertificationStatus, MyCertification, MyCertificationStatus }

export const CertificationFailureCode = {
  NOT_CERTIFIABLE: 'NOT_CERTIFIABLE',
  ALREADY_REQUESTED: 'ALREADY_REQUESTED',
  CERTIFICATION_UNKNOWN: 'CERTIFICATION_UNKNOWN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type CertificationFailureCode = (typeof CertificationFailureCode)[keyof typeof CertificationFailureCode]

export interface CertificationFailure {
  readonly code: CertificationFailureCode
  readonly message: string
}

export type CertificationResult<A> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: CertificationFailure }

export const FAILURE_MESSAGES: Readonly<Record<CertificationFailureCode, string>> = {
  NOT_CERTIFIABLE: 'Cette machine ne peut pas recevoir de demande d’habilitation.',
  ALREADY_REQUESTED: 'Vous avez déjà une demande en cours sur cette machine.',
  CERTIFICATION_UNKNOWN: 'Cette demande n’existe pas, ou ne porte pas sur un de vos ateliers.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'Les habilitations sont momentanément indisponibles.',
}

export const failure = (code: CertificationFailureCode): CertificationResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})

export const MY_STATUS_LABELS: Readonly<Record<MyCertificationStatus, string>> = {
  NONE: 'Non demandée',
  PENDING: 'En attente',
  GRANTED: 'Habilité',
  REVOKED: 'Refusée',
}

export const REQUEST_STATUS_LABELS: Readonly<Record<CertificationStatus, string>> = {
  PENDING: 'En attente',
  GRANTED: 'Accordée',
  REVOKED: 'Révoquée',
}

export const isRequestable = (status: MyCertificationStatus): boolean => status === 'NONE' || status === 'REVOKED'
