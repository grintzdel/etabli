import type {
  AtelierDetail,
  AtelierSummary,
  MachineDetail,
  MachineKind,
  MachineStatus,
  PublicMachine,
} from '@etabli/contract'

import type { Result } from '../../../shared/core/http/result'

export type { AtelierDetail, AtelierSummary, MachineDetail, MachineKind, MachineStatus, PublicMachine }

export const DIRECTORY_RADIUS_KM = 1000

export const AtelierFailureCode = {
  INVALID_FILTER: 'INVALID_FILTER',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type AtelierFailureCode = (typeof AtelierFailureCode)[keyof typeof AtelierFailureCode]

export interface AtelierFailure {
  readonly code: AtelierFailureCode
  readonly message: string
}

export type AtelierResult<A> = Result<A, AtelierFailure>

export const FAILURE_MESSAGES: Readonly<Record<AtelierFailureCode, string>> = {
  INVALID_FILTER: 'Ces critères de recherche ne sont pas valides.',
  NOT_FOUND: 'Cet atelier n’existe pas ou n’est pas encore publié.',
  UNAUTHORIZED: 'Votre session a expiré.',
  UNREACHABLE: 'L’annuaire est momentanément indisponible.',
}

export const failure = (code: AtelierFailureCode): AtelierResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})

export interface DirectoryPoint {
  readonly latitude: number
  readonly longitude: number
}

export const MACHINE_KIND_LABELS: Readonly<Record<MachineKind, string>> = {
  LASER_CUTTER: 'Découpe laser',
  PRINTER_3D: 'Impression 3D',
  CNC_MILL: 'Fraiseuse CNC',
  WOOD_LATHE: 'Tour à bois',
  SEWING: 'Couture',
  ELECTRONICS_BENCH: 'Établi électronique',
}

export const MACHINE_STATUS_LABELS: Readonly<Record<MachineStatus, string>> = {
  AVAILABLE: 'Disponible',
  MAINTENANCE: 'En maintenance',
  RETIRED: 'Retirée',
}

export const MACHINE_STATUS_TONES: Readonly<Record<MachineStatus, 'ok' | 'warn' | 'neutral'>> = {
  AVAILABLE: 'ok',
  MAINTENANCE: 'warn',
  RETIRED: 'neutral',
}

export const formatDistance = (km: number): string =>
  km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`
