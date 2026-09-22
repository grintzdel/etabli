export const CheckInTokenStatus = {
  IDLE: 'idle',
  SUCCESS: 'success',
  ERROR: 'error',
} as const
export type CheckInTokenStatus = (typeof CheckInTokenStatus)[keyof typeof CheckInTokenStatus]

export interface CheckInTokenFormState {
  readonly status: CheckInTokenStatus
  readonly message: string | null
}

export const idleCheckInToken: CheckInTokenFormState = { status: CheckInTokenStatus.IDLE, message: null }

export const checkInTokenRotated = (message: string): CheckInTokenFormState => ({
  status: CheckInTokenStatus.SUCCESS,
  message,
})

export const checkInTokenRefused = (message: string): CheckInTokenFormState => ({
  status: CheckInTokenStatus.ERROR,
  message,
})

export type CheckInTokenFormAction = (
  state: CheckInTokenFormState,
  formData: FormData
) => Promise<CheckInTokenFormState>
