export const NfcTagStatus = {
  IDLE: 'idle',
  SUCCESS: 'success',
  ERROR: 'error',
} as const
export type NfcTagStatus = (typeof NfcTagStatus)[keyof typeof NfcTagStatus]

export interface NfcTagFormState {
  readonly status: NfcTagStatus
  readonly message: string | null
}

export const idleNfcTag: NfcTagFormState = { status: NfcTagStatus.IDLE, message: null }

export const nfcTagSaved = (message: string): NfcTagFormState => ({ status: NfcTagStatus.SUCCESS, message })

export const nfcTagRefused = (message: string): NfcTagFormState => ({ status: NfcTagStatus.ERROR, message })

export type NfcTagFormAction = (state: NfcTagFormState, formData: FormData) => Promise<NfcTagFormState>

export const parseNfcTag = (formData: FormData): string | null => {
  const raw = formData.get('nfcTagId')
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length === 0 ? null : trimmed
}
