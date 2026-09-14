import type {
  AdminAtelier,
  AtelierDetail,
  AtelierStatus,
  AtelierSummary,
  CompleteOnboardingInput,
  CreateAtelierInput,
  CreateMachineInput,
  MachineKind,
  MachineStatus,
  ManagedMachine,
  ManagedParc,
  OnboardingResult,
  PublicMachine,
  SetAtelierStatusInput,
  UpdateMachineInput,
} from '@etabli/contract'

export type {
  AdminAtelier,
  AtelierDetail,
  AtelierStatus,
  AtelierSummary,
  CompleteOnboardingInput,
  CreateAtelierInput,
  CreateMachineInput,
  MachineKind,
  MachineStatus,
  ManagedMachine,
  ManagedParc,
  OnboardingResult,
  PublicMachine,
  SetAtelierStatusInput,
  UpdateMachineInput,
}

export const ATELIER_STATUSES: ReadonlyArray<AtelierStatus> = ['DRAFT', 'PUBLISHED', 'CLOSED']

export const ATELIER_STATUS_LABELS: Readonly<Record<AtelierStatus, string>> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CLOSED: 'Fermé',
}

export const isAtelierStatus = (value: string): value is AtelierStatus =>
  (ATELIER_STATUSES as ReadonlyArray<string>).includes(value)

export const MACHINE_STATUSES: ReadonlyArray<MachineStatus> = ['AVAILABLE', 'MAINTENANCE', 'RETIRED']

export const isMachineStatus = (value: string): value is MachineStatus =>
  (MACHINE_STATUSES as ReadonlyArray<string>).includes(value)

export const AtelierFailureCode = {
  INVALID_FILTER: 'INVALID_FILTER',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SLUG_TAKEN: 'SLUG_TAKEN',
  UNREACHABLE: 'UNREACHABLE',
} as const
export type AtelierFailureCode = (typeof AtelierFailureCode)[keyof typeof AtelierFailureCode]

export interface AtelierFailure {
  readonly code: AtelierFailureCode
  readonly message: string
}

export type AtelierResult<A> =
  | { readonly ok: true; readonly value: A }
  | { readonly ok: false; readonly error: AtelierFailure }

export const FAILURE_MESSAGES: Readonly<Record<AtelierFailureCode, string>> = {
  INVALID_FILTER: 'Ces critères de recherche ne sont pas valides.',
  NOT_FOUND: "Cet atelier n'existe pas ou n'est pas encore publié.",
  UNAUTHORIZED: 'Votre session a expiré.',
  FORBIDDEN: 'Cette page est réservée à l’administration de la plateforme.',
  SLUG_TAKEN: 'Un autre atelier occupe déjà cet identifiant d’URL.',
  UNREACHABLE: "L'annuaire est momentanément indisponible.",
}

export const failure = (code: AtelierFailureCode): AtelierResult<never> => ({
  ok: false,
  error: { code, message: FAILURE_MESSAGES[code] },
})

export interface DirectoryFilters {
  readonly city?: string
  readonly machineKind?: MachineKind
}

export const MACHINE_KINDS: ReadonlyArray<MachineKind> = [
  'LASER_CUTTER',
  'PRINTER_3D',
  'CNC_MILL',
  'WOOD_LATHE',
  'SEWING',
  'ELECTRONICS_BENCH',
]

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

export const isMachineKind = (value: string): value is MachineKind =>
  (MACHINE_KINDS as ReadonlyArray<string>).includes(value)

export const parseDirectoryFilters = (
  params: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>
): DirectoryFilters => {
  const first = (key: string): string | undefined => {
    const raw = params[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }

  const city = first('city')
  const machineKind = first('machineKind')

  return {
    ...(city === undefined ? {} : { city }),
    ...(machineKind !== undefined && isMachineKind(machineKind) ? { machineKind } : {}),
  }
}

export const formatDistance = (km: number): string =>
  km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`

export const PRACTICES: ReadonlyArray<string> = [
  'Bois',
  'Métal',
  'Textile',
  'Électronique',
  'Impression 3D',
  'Découpe laser',
]
