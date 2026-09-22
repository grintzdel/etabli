'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import type { UpdateProfileInput } from '@/modules/identity/core/model/profile'
import { IdentityFailureCode } from '@/modules/identity/core/model/session'
import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import { identityPort } from './container'
import { requireSession } from './session'

export const saveProfileAction = async (_state: SettingsFormState, formData: FormData): Promise<SettingsFormState> => {
  await requireSession('/parametres')

  const displayName = typeof formData.get('displayName') === 'string' ? String(formData.get('displayName')) : ''
  const practice = formData.getAll('practice').filter((value) => typeof value === 'string')

  if (displayName.trim() === '') return settingsRefused('Le nom affiché est obligatoire.')
  if (practice.length === 0) return settingsRefused('Déclarez au moins une pratique.')

  const patch: UpdateProfileInput = { displayName, practice }

  const result = await identityPort.updateProfile(patch)
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect('/connexion?next=/parametres')
    return settingsRefused(result.error.message)
  }

  refresh()
  return settingsSaved('Profil enregistré.')
}
