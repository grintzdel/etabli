'use server'

import { redirect } from 'next/navigation'

import { IdentityFailureCode, PASSWORD_MIN_LENGTH } from '@/modules/identity/core/model/session'
import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import { identityPort } from './container'
import { readSessionToken, writeSessionCookie } from './session'

const text = (formData: FormData, name: string): string => {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export const changePasswordAction = async (
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> => {
  const token = await readSessionToken()
  if (token === null) redirect('/connexion?next=/parametres')

  const currentPassword = text(formData, 'currentPassword')
  const newPassword = text(formData, 'newPassword')

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return settingsRefused(`Le nouveau mot de passe fait au moins ${PASSWORD_MIN_LENGTH} caractères.`)
  }
  if (newPassword !== text(formData, 'confirmPassword')) {
    return settingsRefused('Les deux mots de passe ne correspondent pas.')
  }

  const result = await identityPort.changePassword(token, { currentPassword, newPassword })
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.INVALID_CREDENTIALS) {
      return settingsRefused('Le mot de passe actuel est incorrect.')
    }
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect('/connexion?next=/parametres')
    return settingsRefused(result.error.message)
  }

  await writeSessionCookie(result.value.token, result.value.expiresAt)
  return settingsSaved('Mot de passe changé.')
}
