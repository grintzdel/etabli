'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import type { UpdatePreferencesInput } from '@/modules/identity/core/model/preferences'
import { isTheme } from '@/modules/identity/core/model/preferences'
import { IdentityFailureCode } from '@/modules/identity/core/model/session'
import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import { preferencesPort } from './container'
import { readSessionToken } from './session'

export const savePreferencesAction = async (
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/parametres')

  const theme = formData.get('theme')
  const atelier = formData.get('defaultAtelierId')

  const patch: UpdatePreferencesInput = {
    ...(isTheme(theme) ? { theme } : {}),
    ...(atelier === null ? {} : { defaultAtelierId: typeof atelier === 'string' && atelier !== '' ? atelier : null }),
  }

  const result = await preferencesPort.update(token, patch)
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect('/connexion?next=/parametres')
    return settingsRefused(result.error.message)
  }

  refresh()
  return settingsSaved('Préférences enregistrées.')
}
