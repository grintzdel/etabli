'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import type { UpdateAdminUser } from '@/modules/identity/core/model/admin-user'
import { isPlatformRole, isUserStatus } from '@/modules/identity/core/model/admin-user'
import { IdentityFailureCode } from '@/modules/identity/core/model/session'
import type { SettingsFormState } from '@/modules/identity/core/model/settings'
import { settingsRefused, settingsSaved } from '@/modules/identity/core/model/settings'

import { adminUserPort } from './container'
import { readSessionToken } from './session'

const ADMIN_PATH = '/admin/utilisateurs'

const readPatch = (formData: FormData): UpdateAdminUser => {
  const platformRole = formData.get('platformRole')
  const status = formData.get('status')

  return {
    ...(typeof platformRole === 'string' && isPlatformRole(platformRole) ? { platformRole } : {}),
    ...(typeof status === 'string' && isUserStatus(status) ? { status } : {}),
  }
}

export const updateAdminUserAction = async (
  _state: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> => {
  const token = await readSessionToken()
  if (token === null) redirect(`/connexion?next=${ADMIN_PATH}`)

  const userId = formData.get('userId')
  if (typeof userId !== 'string') return settingsRefused('Ce compte n’existe pas.')

  const patch = readPatch(formData)
  if (Object.keys(patch).length === 0) return settingsRefused('Rien à changer sur ce compte.')

  const result = await adminUserPort.update(token, userId, patch)
  if (!result.ok) {
    if (result.error.code === IdentityFailureCode.UNAUTHORIZED) redirect(`/connexion?next=${ADMIN_PATH}`)
    return settingsRefused(result.error.message)
  }

  refresh()
  return settingsSaved('Compte mis à jour.')
}
