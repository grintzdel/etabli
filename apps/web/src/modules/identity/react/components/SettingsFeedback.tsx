import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { SettingsStatus } from '@/modules/identity/core/model/settings'

export type SettingsFeedbackProps = {
  readonly state: SettingsFormState
}

export const SettingsFeedback = ({ state }: SettingsFeedbackProps) => {
  if (state.message === null) return null

  const refused = state.status === SettingsStatus.ERROR

  return (
    <p
      role={refused ? 'alert' : 'status'}
      className={refused ? 'text-status-danger text-sm' : 'text-status-ok text-sm'}
    >
      {state.message}
    </p>
  )
}
