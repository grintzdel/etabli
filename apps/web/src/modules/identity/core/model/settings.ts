export const SettingsStatus = {
  IDLE: 'idle',
  SUCCESS: 'success',
  ERROR: 'error',
} as const
export type SettingsStatus = (typeof SettingsStatus)[keyof typeof SettingsStatus]

export interface SettingsFormState {
  readonly status: SettingsStatus
  readonly message: string | null
}

export const idleSettings: SettingsFormState = { status: SettingsStatus.IDLE, message: null }

export const settingsSaved = (message: string): SettingsFormState => ({
  status: SettingsStatus.SUCCESS,
  message,
})

export const settingsRefused = (message: string): SettingsFormState => ({
  status: SettingsStatus.ERROR,
  message,
})

export type SettingsFormAction = (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>
